import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { Article } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ArticleAnalysis } from '../ai/ai.types';
import type { DiscoveredArticle } from '../sources/source.types';

@Injectable()
export class PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveWatch(watchId: string) {
    return this.prisma.watch.findFirst({
      where: { id: watchId, active: true },
    });
  }

  async upsertArticle(discovered: DiscoveredArticle): Promise<Article> {
    const fingerprint = createHash('sha256')
      .update(`${discovered.title}|${discovered.description ?? ''}|${discovered.url}`)
      .digest('hex');

    return this.prisma.article
      .upsert({
        where: { canonicalUrl: discovered.url },
        update: {
          title: discovered.title,
          description: discovered.description,
          sourceName: discovered.sourceName,
          sourceType: discovered.sourceType,
          imageUrl: discovered.imageUrl,
          publishedAt: discovered.publishedAt,
        },
        create: {
          canonicalUrl: discovered.url,
          fingerprint,
          title: discovered.title,
          description: discovered.description,
          sourceName: discovered.sourceName,
          sourceType: discovered.sourceType,
          imageUrl: discovered.imageUrl,
          publishedAt: discovered.publishedAt,
        },
      })
      .catch(() =>
        this.prisma.article.findFirstOrThrow({
          where: {
            OR: [{ canonicalUrl: discovered.url }, { fingerprint }],
          },
        }),
      );
  }

  async isAttached(watchId: string, articleId: string) {
    const existing = await this.prisma.watchArticle.findUnique({
      where: {
        watchId_articleId: { watchId, articleId },
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  attachAnalysis(watchId: string, articleId: string, analysis: ArticleAnalysis, eventKey: string) {
    return this.prisma.watchArticle.create({
      data: {
        watchId,
        articleId,
        relevanceScore: analysis.relevanceScore,
        importanceScore: analysis.importanceScore,
        isNewInformation: analysis.isNewInformation,
        eventType: analysis.eventType,
        eventKey,
        summary: analysis.summary,
      },
    });
  }

  markChecked(watchId: string) {
    return this.prisma.watch.update({
      where: { id: watchId },
      data: { lastCheckedAt: new Date() },
    });
  }
}
