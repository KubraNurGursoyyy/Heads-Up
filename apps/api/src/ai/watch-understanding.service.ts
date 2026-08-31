import { Injectable, Logger } from '@nestjs/common';
import {
  inferFallbackCategory,
  normalizeCategoryName,
  normalizeWhitespace,
} from '../common/text-normalization';
import { buildLocalWatch, suggestLocally } from './local-ai';
import { StructuredAiClient } from './structured-ai-client';
import type { WatchInterpretation, WatchSuggestion } from './ai.types';

@Injectable()
export class WatchUnderstandingService {
  private readonly logger = new Logger(WatchUnderstandingService.name);
  private readonly suggestionCache = new Map<
    string,
    { expiresAt: number; value: WatchSuggestion }
  >();

  constructor(private readonly aiClient: StructuredAiClient) {}

  async suggest(prompt: string): Promise<WatchSuggestion> {
    const originalPrompt = normalizeWhitespace(prompt);
    const cacheKey = originalPrompt.toLocaleLowerCase('tr-TR');
    const cached = this.suggestionCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const suggestion = await this.createSuggestion(originalPrompt);
    this.cache(cacheKey, suggestion);
    return suggestion;
  }

  async interpret(prompt: string): Promise<WatchInterpretation> {
    const cleanPrompt = normalizeWhitespace(prompt);
    if (!this.aiClient.isAvailable()) return buildLocalWatch(cleanPrompt);

    try {
      const result = await this.aiClient.generate<WatchInterpretation>(
        'Kullanıcının takip isteğini yapılandır. topic kanonik konu adı, intent kısa amaç açıklaması, category kısa Türkçe üst seviye kategori olsun. aliases en çok 8 alternatif ad, searchQueries en çok 5 etkili arama, notifyEvents en çok 8 kısa snake_case olay türü içersin.',
        cleanPrompt,
        {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            intent: { type: 'string' },
            category: { type: 'string', minLength: 1, maxLength: 40 },
            aliases: { type: 'array', items: { type: 'string' } },
            searchQueries: { type: 'array', items: { type: 'string' } },
            notifyEvents: { type: 'array', items: { type: 'string' } },
          },
          required: ['topic', 'intent', 'category', 'aliases', 'searchQueries', 'notifyEvents'],
        },
      );

      const fallbackCategory = inferFallbackCategory(cleanPrompt);
      return {
        topic: normalizeWhitespace(result.topic).slice(0, 120),
        intent: normalizeWhitespace(result.intent),
        category:
          fallbackCategory !== 'Diğer' ? fallbackCategory : normalizeCategoryName(result.category),
        aliases: result.aliases.map(normalizeWhitespace).filter(Boolean).slice(0, 8),
        searchQueries: result.searchQueries.map(normalizeWhitespace).filter(Boolean).slice(0, 5),
        notifyEvents: result.notifyEvents.map(normalizeWhitespace).filter(Boolean).slice(0, 8),
      };
    } catch (error) {
      this.logger.warn(
        `AI watch interpretation unavailable; local fallback used: ${String(error)}`,
      );
      return buildLocalWatch(cleanPrompt);
    }
  }

  buildQuickWatch(
    prompt: string,
    hints?: { topic?: string; category?: string },
  ): WatchInterpretation {
    const fallback = buildLocalWatch(prompt);

    return {
      ...fallback,
      topic: hints?.topic ? normalizeWhitespace(hints.topic).slice(0, 120) : fallback.topic,
      category: hints?.category ? normalizeCategoryName(hints.category) : fallback.category,
    };
  }

  private async createSuggestion(originalPrompt: string): Promise<WatchSuggestion> {
    if (!this.aiClient.isAvailable()) {
      return suggestLocally(originalPrompt);
    }

    try {
      const result = await this.aiClient.generate<{
        correctedPrompt: string;
        topic: string;
        category: string;
      }>(
        'Kullanıcının Türkçe takip isteğini yalnızca yazım, imla, eksik Türkçe karakter ve özel isim büyük/küçük harfleri açısından düzelt. Anlamı, isteği veya kapsamı değiştirme. correctedPrompt doğal ve kısa olsun. topic takip edilen kanonik konu adı olsun. category üst seviye, kısa ve Türkçe bir kategori etiketi olsun. Mevcut bir kategori uygunsa Oyun, Kitap, Film & Dizi, Teknoloji, Müzik, Spor, Bilim, Finans & Ekonomi, Seyahat, Moda, Otomotiv gibi etiketleri kullan; gerçekten farklı bir alan ise 1-3 kelimelik yeni bir kategori üret.',
        originalPrompt,
        {
          type: 'object',
          properties: {
            correctedPrompt: { type: 'string', minLength: 3, maxLength: 500 },
            topic: { type: 'string', minLength: 1, maxLength: 120 },
            category: { type: 'string', minLength: 1, maxLength: 40 },
          },
          required: ['correctedPrompt', 'topic', 'category'],
        },
      );

      const correctedPrompt = normalizeWhitespace(result.correctedPrompt) || originalPrompt;
      const aiCategory = normalizeCategoryName(result.category);
      const fallbackCategory = inferFallbackCategory(correctedPrompt);

      return {
        originalPrompt,
        correctedPrompt,
        changed: correctedPrompt !== originalPrompt,
        topic: normalizeWhitespace(result.topic).slice(0, 120) || originalPrompt.slice(0, 120),
        category: fallbackCategory !== 'Diğer' ? fallbackCategory : aiCategory,
      };
    } catch (error) {
      this.logger.warn(`AI watch suggestion unavailable; local fallback used: ${String(error)}`);
      return suggestLocally(originalPrompt);
    }
  }

  private cache(key: string, value: WatchSuggestion) {
    this.suggestionCache.set(key, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      value,
    });

    if (this.suggestionCache.size <= 100) {
      return;
    }

    const oldestKey = this.suggestionCache.keys().next().value as string | undefined;
    if (oldestKey) {
      this.suggestionCache.delete(oldestKey);
    }
  }
}
