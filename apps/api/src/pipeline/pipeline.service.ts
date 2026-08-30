import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationMode, Watch } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SourcesService } from '../sources/sources.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { articleContainsRequiredTerms, normalizeRequiredTerms } from '../common/required-terms';

export type ProcessWatchOptions = {
  historical?: boolean;
};

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    private readonly ai: AiService,
    private readonly notifications: NotificationsService,
  ) {}

  async processWatch(watchId: string, options: ProcessWatchOptions = {}) {
    const watch = await this.prisma.watch.findUnique({ where: { id: watchId } });
    if (!watch || !watch.active) return { skipped: true };

    const historical = options.historical ?? !watch.lastCheckedAt;
    const queries = [...((watch.searchQueries as string[]) ?? []), watch.topic, watch.prompt];

    const discovered = await this.sources.discover(queries, {
      topic: watch.topic,
      prompt: watch.prompt,
      category: watch.category,
      aliases: (watch.aliases as string[]) ?? [],
      requiredTerms: normalizeRequiredTerms(watch.requiredTerms),
      historical,
    });

    let attached = 0;
    let pushed = 0;

    for (const discoveredArticle of discovered) {
      if (
        !articleContainsRequiredTerms(
          watch.requiredTerms,
          discoveredArticle.title,
          discoveredArticle.description,
        )
      ) {
        continue;
      }

      const url = discoveredArticle.url;
      const fingerprint = createHash('sha256')
        .update(`${discoveredArticle.title}|${discoveredArticle.description ?? ''}|${url}`)
        .digest('hex');

      const article = await this.prisma.article
        .upsert({
          where: { canonicalUrl: url },
          update: {
            title: discoveredArticle.title,
            description: discoveredArticle.description,
            sourceName: discoveredArticle.sourceName,
            sourceType: discoveredArticle.sourceType,
            imageUrl: discoveredArticle.imageUrl,
            publishedAt: discoveredArticle.publishedAt,
          },
          create: {
            canonicalUrl: url,
            fingerprint,
            title: discoveredArticle.title,
            description: discoveredArticle.description,
            sourceName: discoveredArticle.sourceName,
            sourceType: discoveredArticle.sourceType,
            imageUrl: discoveredArticle.imageUrl,
            publishedAt: discoveredArticle.publishedAt,
          },
        })
        .catch(async () =>
          this.prisma.article.findFirstOrThrow({
            where: {
              OR: [{ canonicalUrl: url }, { fingerprint }],
            },
          }),
        );

      const exists = await this.prisma.watchArticle.findUnique({
        where: {
          watchId_articleId: {
            watchId,
            articleId: article.id,
          },
        },
      });
      if (exists) continue;

      const analysis = await this.ai.analyzeArticle(watch, article);
      if (!analysis.relevant || analysis.relevanceScore < 0.35) continue;

      const eventKey = this.normalizeEventKey(analysis.eventKey, analysis.eventType, article.title);

      await this.prisma.watchArticle.create({
        data: {
          watchId,
          articleId: article.id,
          relevanceScore: analysis.relevanceScore,
          importanceScore: analysis.importanceScore,
          isNewInformation: analysis.isNewInformation,
          eventType: analysis.eventType,
          eventKey,
          summary: analysis.summary,
        },
      });
      attached += 1;

      const oldHistoricalArticle = historical && !this.isRecentEnoughForPush(article.publishedAt);

      if (
        !oldHistoricalArticle &&
        this.shouldPush(
          watch,
          analysis.importanceScore,
          analysis.isNewInformation,
          analysis.eventType,
        )
      ) {
        await this.notifications.send(
          watch.userId,
          watch.id,
          article.id,
          eventKey,
          article.canonicalUrl,
          watch.topic,
          analysis.summary || article.title,
        );
        pushed += 1;
      }
    }

    await this.prisma.watch.update({
      where: { id: watch.id },
      data: { lastCheckedAt: new Date() },
    });

    this.logger.log(
      `${watch.topic}: historical=${historical} discovered=${discovered.length} attached=${attached} pushed=${pushed}`,
    );

    return {
      discovered: discovered.length,
      attached,
      pushed,
      historical,
    };
  }

  private normalizeEventKey(raw: string, eventType: string, title: string) {
    const base = (raw || `${eventType}_${title}`)
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 180);

    return base || 'update';
  }

  private shouldPush(watch: Watch, importance: number, isNew: boolean, eventType: string) {
    if (watch.notificationMode === NotificationMode.OFF) return false;
    if (watch.notificationMode === NotificationMode.ALL_RELEVANT) return true;
    if (watch.notificationMode === NotificationMode.IMPORTANT_ONLY) {
      return isNew && importance >= watch.importanceThreshold;
    }

    const events = ((watch.notifyEvents as string[]) ?? []).map(value => value.toLowerCase());
    const normalizedEvent = eventType.toLowerCase();

    return (
      isNew &&
      events.some(value => normalizedEvent.includes(value) || value.includes(normalizedEvent))
    );
  }

  private isRecentEnoughForPush(publishedAt: Date | null) {
    if (!publishedAt) return false;
    const maxAgeMs = 72 * 60 * 60 * 1000;
    return Date.now() - publishedAt.getTime() <= maxAgeMs;
  }
}
