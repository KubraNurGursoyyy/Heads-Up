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
    hints?: { topic?: string; category?: string },
  ) {
    const cleanPrompt = normalizeWhitespace(prompt);

    const existing = await this.prisma.watch.findMany({
      where: { userId },
      select: { prompt: true },
    });

    if (existing.some(watch => sameTextInsensitive(watch.prompt, cleanPrompt))) {
      throw new ConflictException(
        'Bu takip zaten mevcut. Büyük/küçük harf veya Türkçe karakter farkları ayrı takip sayılmaz.',
      );
    }

    const parsed = this.ai.buildQuickWatch(cleanPrompt, hints);
    const category = normalizeCategoryName(parsed.category);

    const watch = await this.prisma.watch.create({
      data: {
        userId,
        prompt: cleanPrompt,
        topic: normalizeWhitespace(parsed.topic),
        intent: normalizeWhitespace(parsed.intent),
        category,
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
    },
  ) {
    await this.assertOwned(userId, id);

    return this.prisma.watch.update({
      where: { id },
      data: {
        ...data,
        ...(data.category !== undefined
          ? { category: normalizeCategoryName(data.category) }
          : {}),
      },
      include: { _count: { select: { watchArticles: true } } },
    });
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

    if (!watch.active) {
      return {
        skipped: true,
        reason: 'paused',
        message: 'Takip duraklatılmış. Önce devam ettirip tekrar tara.',
      };
    }

    const result = await this.pipeline.processWatch(id, { historical: true });

    return {
      queued: false,
      completed: true,
      ...result,
    };
  }

  private async assertOwned(userId: string, id: string) {
    const watch = await this.prisma.watch.findFirst({ where: { id, userId } });
    if (!watch) throw new NotFoundException('Takip bulunamadı.');
    return watch;
  }
}
