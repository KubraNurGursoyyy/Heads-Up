import { Injectable, Logger } from '@nestjs/common';
import { ArticleAnalyzerService } from '../ai/article-analyzer.service';
import { articleContainsRequiredTerms, normalizeRequiredTerms } from '../common/required-terms';
import { NotificationsService } from '../notifications/notifications.service';
import { SourcesService } from '../sources/sources.service';
import { NotificationPolicyService } from './notification-policy.service';
import { PipelineRepository } from './pipeline.repository';
import type { ProcessWatchOptions, ProcessWatchResult } from './pipeline.types';

export type { ProcessWatchOptions, ProcessWatchResult } from './pipeline.types';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly repository: PipelineRepository,
    private readonly sources: SourcesService,
    private readonly analyzer: ArticleAnalyzerService,
    private readonly notificationPolicy: NotificationPolicyService,
    private readonly notifications: NotificationsService,
  ) {}

  async processWatch(
    watchId: string,
    options: ProcessWatchOptions = {},
  ): Promise<ProcessWatchResult> {
    const watch = await this.repository.findActiveWatch(watchId);
    if (!watch) return { skipped: true };

    const historical = options.historical ?? !watch.lastCheckedAt;
    const discovered = await this.sources.discover(
      [...((watch.searchQueries as string[]) ?? []), watch.topic, watch.prompt],
      {
        topic: watch.topic,
        prompt: watch.prompt,
        category: watch.category,
        aliases: (watch.aliases as string[]) ?? [],
        requiredTerms: normalizeRequiredTerms(watch.requiredTerms),
        historical,
      },
    );

    let attached = 0;
    let pushed = 0;

    for (const candidate of discovered) {
      if (!this.matchesRequiredTerms(watch.requiredTerms, candidate.title, candidate.description)) {
        continue;
      }

      const article = await this.repository.upsertArticle(candidate);
      if (await this.repository.isAttached(watch.id, article.id)) continue;

      const analysis = await this.analyzer.analyze(watch, article);
      if (!analysis.relevant || analysis.relevanceScore < 0.35) continue;

      const eventKey = this.notificationPolicy.eventKey(
        analysis.eventKey,
        analysis.eventType,
        article.title,
      );
      await this.repository.attachAnalysis(watch.id, article.id, analysis, eventKey);
      attached += 1;

      if (this.notificationPolicy.shouldNotify(watch, analysis, article.publishedAt, historical)) {
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

    await this.repository.markChecked(watch.id);
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

  private matchesRequiredTerms(requiredTerms: unknown, title: string, description?: string) {
    return articleContainsRequiredTerms(requiredTerms, title, description);
  }
}
