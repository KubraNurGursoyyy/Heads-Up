import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../jobs/queue.service';
import { PipelineService } from '../pipeline/pipeline.service';
import {
  buildCategoryStats,
  normalizeCategoryName,
  normalizeWhitespace,
  sameTextInsensitive,
} from '../common/text-normalization';
import {
  keepRequiredTermsPresentInText,
  normalizeRequiredTerms,
  requiredTermsKey,
} from '../common/required-terms';

@Injectable()
export class WatchesService {
  private readonly logger = new Logger(WatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly queue: QueueService,
    private readonly pipeline: PipelineService,
  ) {}

  list(userId: string) {
    return this.prisma.watch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { watchArticles: true } } },
    });
  }

  async listCategories(userId: string) {
    const watches = await this.prisma.watch.findMany({
      where: { userId },
      select: { category: true },
    });
    return buildCategoryStats(watches.map(watch => watch.category));
  }

  suggest(prompt: string) {
    return this.ai.suggestWatch(normalizeWhitespace(prompt));
  }

  async create(
    userId: string,
    prompt: string,
    mode: NotificationMode = 'IMPORTANT_ONLY',
    hints?: { topic?: string; category?: string; requiredTerms?: string[] },
  ) {
    const cleanPrompt = normalizeWhitespace(prompt);
    const requiredTerms = keepRequiredTermsPresentInText(hints?.requiredTerms, cleanPrompt);
    const existing = await this.prisma.watch.findMany({
      where: { userId },
      select: { prompt: true, requiredTerms: true },
    });

    if (
      existing.some(
        watch =>
          sameTextInsensitive(watch.prompt, cleanPrompt) &&
          requiredTermsKey(watch.requiredTerms) === requiredTermsKey(requiredTerms),
      )
    ) {
      throw new ConflictException('Bu takip ve kesin kelime seçimi zaten mevcut.');
    }

    const parsed = this.ai.buildQuickWatch(cleanPrompt, hints);
    const watch = await this.prisma.watch.create({
      data: {
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
      },
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
    const current = await this.assertOwned(userId, id);
    const promptSupplied = data.prompt !== undefined;
    const cleanPrompt = promptSupplied ? normalizeWhitespace(data.prompt!) : current.prompt;
    const requiredTerms =
      data.requiredTerms !== undefined
        ? keepRequiredTermsPresentInText(data.requiredTerms, cleanPrompt)
        : normalizeRequiredTerms(current.requiredTerms);
    const matchingChanged = promptSupplied || data.requiredTerms !== undefined;
    const parsed = promptSupplied ? this.ai.buildQuickWatch(cleanPrompt) : null;

    if (matchingChanged) {
      const others = await this.prisma.watch.findMany({
        where: { userId, NOT: { id } },
        select: { prompt: true, requiredTerms: true },
      });
      if (
        others.some(
          watch =>
            sameTextInsensitive(watch.prompt, cleanPrompt) &&
            requiredTermsKey(watch.requiredTerms) === requiredTermsKey(requiredTerms),
        )
      ) {
        throw new ConflictException('Bu takip ve kesin kelime seçimi zaten mevcut.');
      }
    }

    const updated = await this.prisma.watch.update({
      where: { id },
      data: {
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
      },
      include: { _count: { select: { watchArticles: true } } },
    });

    if (matchingChanged) void this.queue.enqueueWatch(id, true).catch(() => undefined);
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.$transaction(async tx => {
      await tx.notification.deleteMany({ where: { watchId: id } });
      await tx.watchArticle.deleteMany({ where: { watchId: id } });
      await tx.watch.delete({ where: { id } });
    });
    return { ok: true };
  }

  async runNow(userId: string, id: string) {
    const watch = await this.assertOwned(userId, id);
    if (!watch.active)
      return {
        skipped: true,
        reason: 'paused',
        message: 'Takip duraklatılmış. Önce devam ettirip tekrar tara.',
      };
    const result = await this.pipeline.processWatch(id, { historical: true });
    return { queued: false, completed: true, ...result };
  }

  private async assertOwned(userId: string, id: string) {
    const watch = await this.prisma.watch.findFirst({ where: { id, userId } });
    if (!watch) throw new NotFoundException('Takip bulunamadı.');
    return watch;
  }
}
