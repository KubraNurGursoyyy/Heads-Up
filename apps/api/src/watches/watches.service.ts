import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationMode } from '@prisma/client';
import { WatchUnderstandingService } from '../ai/watch-understanding.service';
import { keepRequiredTermsPresentInText, normalizeRequiredTerms } from '../common/required-terms';
import {
  buildCategoryStats,
  normalizeCategoryName,
  normalizeWhitespace,
} from '../common/text-normalization';
import { QueueService } from '../jobs/queue.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { WatchUniquenessService } from './watch-uniqueness.service';
import { WatchesRepository } from './watches.repository';

@Injectable()
export class WatchesService {
  private readonly logger = new Logger(WatchesService.name);

  constructor(
    private readonly repository: WatchesRepository,
    private readonly uniqueness: WatchUniquenessService,
    private readonly watchUnderstanding: WatchUnderstandingService,
    private readonly queue: QueueService,
    private readonly pipeline: PipelineService,
  ) {}

  list(userId: string) {
    return this.repository.list(userId);
  }

  async listCategories(userId: string) {
    return buildCategoryStats(await this.repository.categoryNames(userId));
  }

  suggest(prompt: string) {
    return this.watchUnderstanding.suggest(normalizeWhitespace(prompt));
  }

  async create(
    userId: string,
    prompt: string,
    mode: NotificationMode = NotificationMode.IMPORTANT_ONLY,
    hints?: { topic?: string; category?: string; requiredTerms?: string[] },
  ) {
    const cleanPrompt = normalizeWhitespace(prompt);
    const requiredTerms = keepRequiredTermsPresentInText(hints?.requiredTerms, cleanPrompt);
    await this.uniqueness.assertUnique(userId, cleanPrompt, requiredTerms);

    const parsed = this.watchUnderstanding.buildQuickWatch(cleanPrompt, hints);
    const watch = await this.repository.create({
      userId,
      prompt: cleanPrompt,
      topic: normalizeWhitespace(parsed.topic),
      intent: normalizeWhitespace(parsed.intent),
      category: normalizeCategoryName(parsed.category),
      requiredTerms,
      aliases: parsed.aliases,
      searchQueries: parsed.searchQueries,
      notifyEvents: parsed.notifyEvents,
      notificationMode: mode,
      importanceThreshold: Number(process.env.AI_IMPORTANCE_THRESHOLD ?? 0.72),
    });

    void this.queue.enqueueWatch(watch.id).catch(error => {
      this.logger.warn(`Initial scan could not be queued for ${watch.id}: ${String(error)}`);
    });

    return watch;
  }

  async update(
    userId: string,
    id: string,
    data: {
      active?: boolean;
      notificationMode?: NotificationMode;
      importanceThreshold?: number;
      category?: string;
      prompt?: string;
      requiredTerms?: string[];
    },
  ) {
    const current = await this.ownedWatch(userId, id);
    const promptSupplied = data.prompt !== undefined;
    const cleanPrompt = promptSupplied ? normalizeWhitespace(data.prompt!) : current.prompt;
    const requiredTerms =
      data.requiredTerms !== undefined
        ? keepRequiredTermsPresentInText(data.requiredTerms, cleanPrompt)
        : normalizeRequiredTerms(current.requiredTerms);
    const matchingChanged = promptSupplied || data.requiredTerms !== undefined;

    if (matchingChanged) {
      await this.uniqueness.assertUnique(userId, cleanPrompt, requiredTerms, id);
    }

    const parsed = promptSupplied ? this.watchUnderstanding.buildQuickWatch(cleanPrompt) : null;
    const updated = await this.repository.update(id, {
      active: data.active,
      notificationMode: data.notificationMode,
      importanceThreshold: data.importanceThreshold,
      ...(data.category !== undefined
        ? { category: normalizeCategoryName(data.category) }
        : promptSupplied && parsed
          ? { category: normalizeCategoryName(parsed.category) }
          : {}),
      ...(promptSupplied && parsed
        ? {
            prompt: cleanPrompt,
            topic: normalizeWhitespace(parsed.topic),
            intent: normalizeWhitespace(parsed.intent),
            aliases: parsed.aliases,
            searchQueries: parsed.searchQueries,
            notifyEvents: parsed.notifyEvents,
          }
        : {}),
      ...(data.requiredTerms !== undefined ? { requiredTerms } : {}),
      ...(matchingChanged ? { lastCheckedAt: null } : {}),
    });

    if (matchingChanged) {
      void this.queue.enqueueWatch(id, true).catch(() => undefined);
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    await this.ownedWatch(userId, id);
    await this.repository.remove(id);
    return { ok: true };
  }

  async runNow(userId: string, id: string) {
    const watch = await this.ownedWatch(userId, id);
    if (!watch.active) {
      return {
        skipped: true,
        reason: 'paused',
        message: 'Takip duraklatılmış. Önce devam ettirip tekrar tara.',
      };
    }

    const result = await this.pipeline.processWatch(id, { historical: true });
    return { queued: false, completed: true, ...result };
  }

  private async ownedWatch(userId: string, id: string) {
    const watch = await this.repository.findOwned(userId, id);
    if (!watch) throw new NotFoundException('Takip bulunamadı.');
    return watch;
  }
}
