import { Injectable, Logger } from '@nestjs/common';
import type { Article, Watch } from '@prisma/client';
import { analyzeLocally } from './local-ai';
import { StructuredAiClient } from './structured-ai-client';
import type { ArticleAnalysis } from './ai.types';

@Injectable()
export class ArticleAnalyzerService {
  private readonly logger = new Logger(ArticleAnalyzerService.name);

  constructor(private readonly aiClient: StructuredAiClient) {}

  async analyze(
    watch: Watch,
    article: Pick<Article, 'title' | 'description' | 'sourceName' | 'publishedAt'>,
  ): Promise<ArticleAnalysis> {
    if (!this.aiClient.isAvailable()) {
      return analyzeLocally(watch, article);
    }

    const input = JSON.stringify({
      watch: {
        topic: watch.topic,
        intent: watch.intent,
        aliases: watch.aliases,
        notifyEvents: watch.notifyEvents,
      },
      article: {
        title: article.title,
        description: article.description,
        sourceName: article.sourceName,
        publishedAt: article.publishedAt,
      },
    });

    try {
      return await this.aiClient.generate<ArticleAnalysis>(
        'Bir haberin kullanıcının takibiyle ilişkisini değerlendir. Büyük/küçük harf farklılıklarını önemseme. relevanceScore ve importanceScore 0..1 olsun. isNewInformation, başlık/açıklamanın takip açısından gerçek bir yeni gelişme iddia edip etmediğini göstersin. eventType kısa snake_case olay türü. eventKey aynı gerçek dünya gelişmesini farklı siteler anlatsa da aynı olacak kısa ve kararlı bir kimlik olsun. summary en fazla 2 kısa Türkçe cümle. Sadece başlık/açıklamada desteklenen bilgiye dayan; uydurma yapma.',
        input,
        {
          type: 'object',
          properties: {
            relevant: { type: 'boolean' },
            relevanceScore: { type: 'number', minimum: 0, maximum: 1 },
            importanceScore: { type: 'number', minimum: 0, maximum: 1 },
            isNewInformation: { type: 'boolean' },
            eventType: { type: 'string' },
            eventKey: { type: 'string', minLength: 1, maxLength: 180 },
            summary: { type: 'string' },
          },
          required: [
            'relevant',
            'relevanceScore',
            'importanceScore',
            'isNewInformation',
            'eventType',
            'eventKey',
            'summary',
          ],
        },
      );
    } catch (error) {
      this.logger.warn(`AI article analysis unavailable; local fallback used: ${String(error)}`);
      return analyzeLocally(watch, article);
    }
  }
}
