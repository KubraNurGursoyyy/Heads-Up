import { Injectable, Logger } from '@nestjs/common';
import { Article, Watch } from '@prisma/client';
import {
  applyCommonTurkishCorrections,
  inferFallbackCategory,
  normalizeCategoryName,
  normalizeWhitespace,
} from '../common/text-normalization';

export type WatchInterpretation = {
  topic: string;
  intent: string;
  category: string;
  aliases: string[];
  searchQueries: string[];
  notifyEvents: string[];
};

export type WatchSuggestion = {
  originalPrompt: string;
  correctedPrompt: string;
  changed: boolean;
  topic: string;
  category: string;
};

export type ArticleAnalysis = {
  relevant: boolean;
  relevanceScore: number;
  importanceScore: number;
  isNewInformation: boolean;
  eventType: string;
  eventKey: string;
  summary: string;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private geminiUnavailableUntil = 0;
  private readonly suggestionCache = new Map<string, { expiresAt: number; value: WatchSuggestion }>();

  async suggestWatch(prompt: string): Promise<WatchSuggestion> {
    const originalPrompt = normalizeWhitespace(prompt);
    const cacheKey = originalPrompt.toLocaleLowerCase('tr-TR');
    const cached = this.suggestionCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) return cached.value;

    let suggestion: WatchSuggestion;

    if (!this.canUseGemini()) {
      suggestion = this.fallbackSuggest(originalPrompt);
    } else {
      try {
        const result = await this.callStructured<{
          correctedPrompt: string;
          topic: string;
          category: string;
        }>(
          `Kullanıcının Türkçe takip isteğini yalnızca yazım, imla, eksik Türkçe karakter ve özel isim büyük/küçük harfleri açısından düzelt. Anlamı, isteği veya kapsamı değiştirme. correctedPrompt doğal ve kısa olsun. topic takip edilen kanonik konu adı olsun. category üst seviye, kısa ve Türkçe bir kategori etiketi olsun. Mevcut bir kategori uygunsa Oyun, Kitap, Film & Dizi, Teknoloji, Müzik, Spor, Bilim, Finans & Ekonomi, Seyahat, Moda, Otomotiv gibi etiketleri kullan; gerçekten farklı bir alan ise 1-3 kelimelik yeni bir kategori üret.`,
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

        suggestion = {
          originalPrompt,
          correctedPrompt,
          changed: correctedPrompt !== originalPrompt,
          topic: normalizeWhitespace(result.topic).slice(0, 120) || originalPrompt.slice(0, 120),
          category: fallbackCategory !== 'Diğer' ? fallbackCategory : aiCategory,
        };
      } catch (error) {
        this.logger.warn(`Gemini watch suggestion unavailable; local fallback used: ${String(error)}`);
        suggestion = this.fallbackSuggest(originalPrompt);
      }
    }

    this.suggestionCache.set(cacheKey, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      value: suggestion,
    });

    if (this.suggestionCache.size > 100) {
      const first = this.suggestionCache.keys().next().value as string | undefined;
      if (first) this.suggestionCache.delete(first);
    }

    return suggestion;
  }

  buildQuickWatch(
    prompt: string,
    hints?: { topic?: string; category?: string },
  ): WatchInterpretation {
    const cleanPrompt = normalizeWhitespace(prompt);
    const fallback = this.fallbackInterpret(cleanPrompt);

    return {
      ...fallback,
      topic: hints?.topic
        ? normalizeWhitespace(hints.topic).slice(0, 120)
        : fallback.topic,
      category: hints?.category
        ? normalizeCategoryName(hints.category)
        : fallback.category,
    };
  }

  async interpretWatch(prompt: string): Promise<WatchInterpretation> {
    const cleanPrompt = normalizeWhitespace(prompt);
    if (!this.canUseGemini()) return this.fallbackInterpret(cleanPrompt);

    try {
      const result = await this.callStructured<WatchInterpretation>(
        `Kullanıcının takip isteğini yapılandır. Kullanıcı Türkçe yazabilir ve yazım hataları yapabilir. topic kanonik konu adı, intent neyi beklediğinin kısa açıklaması olsun. category kısa, üst seviye ve Türkçe bir kategori etiketi olsun. Mevcut kategori uygunsa Oyun, Kitap, Film & Dizi, Teknoloji, Müzik, Spor, Bilim, Finans & Ekonomi, Seyahat, Moda, Otomotiv gibi etiketleri yeniden kullan; konu farklı bir alandaysa 1-3 kelimelik yeni kategori üret. aliases en çok 8 ad/alternatif, searchQueries en çok 5 etkili web haber araması, notifyEvents en çok 8 kısa snake_case olay türü üret (ör. release_date, delay, availability). Aramalarda büyük/küçük harfe bağımlı olma.`,
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

      const aiCategory = normalizeCategoryName(result.category);
      const fallbackCategory = inferFallbackCategory(cleanPrompt);

      return {
        ...result,
        topic: normalizeWhitespace(result.topic).slice(0, 120),
        intent: normalizeWhitespace(result.intent),
        category: fallbackCategory !== 'Diğer' ? fallbackCategory : aiCategory,
        aliases: result.aliases.map(normalizeWhitespace).filter(Boolean).slice(0, 8),
        searchQueries: result.searchQueries.map(normalizeWhitespace).filter(Boolean).slice(0, 5),
        notifyEvents: result.notifyEvents.map(normalizeWhitespace).filter(Boolean).slice(0, 8),
      };
    } catch (error) {
      this.logger.warn(`Gemini watch interpretation unavailable; local fallback used: ${String(error)}`);
      return this.fallbackInterpret(cleanPrompt);
    }
  }

  async analyzeArticle(
    watch: Watch,
    article: Pick<Article, 'title' | 'description' | 'sourceName' | 'publishedAt'>,
  ): Promise<ArticleAnalysis> {
    if (!this.canUseGemini()) return this.fallbackAnalyze(watch, article);

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
      return await this.callStructured<ArticleAnalysis>(
        `Bir haberin kullanıcının takibiyle ilişkisini değerlendir. Büyük/küçük harf farklılıklarını önemseme. relevanceScore ve importanceScore 0..1 olsun. isNewInformation, başlık/açıklamanın takip açısından gerçek bir yeni gelişme iddia edip etmediğini göstersin. eventType kısa snake_case olay türü. eventKey aynı gerçek dünya gelişmesini farklı siteler anlatsa da aynı olacak kısa ve kararlı bir kimlik olsun (ör. pc_release_date_2027_announced); farklı bir gelişmeyse farklı olsun. summary en fazla 2 kısa Türkçe cümle. Sadece başlık/açıklamada desteklenen bilgiye dayan; uydurma yapma.`,
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
      this.logger.warn(`Gemini article analysis unavailable; local fallback used: ${String(error)}`);
      return this.fallbackAnalyze(watch, article);
    }
  }

  private canUseGemini() {
    return Boolean(process.env.GEMINI_API_KEY) && Date.now() >= this.geminiUnavailableUntil;
  }

  private async callStructured<T>(instructions: string, input: string, schema: object): Promise<T> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${instructions}\n\nGirdi:\n${input}` }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
        },
      }),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 500);
      if (response.status === 429) {
        this.geminiUnavailableUntil = Date.now() + 10 * 60 * 1000;
        throw new Error('Gemini free-tier quota/rate limit reached (429); using local fallback temporarily');
      }
      throw new Error(`Gemini ${response.status}: ${body}`);
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini response did not contain text');

    return JSON.parse(text) as T;
  }

  private fallbackSuggest(prompt: string): WatchSuggestion {
    const originalPrompt = normalizeWhitespace(prompt);
    const correctedPrompt = applyCommonTurkishCorrections(originalPrompt);
    const interpreted = this.fallbackInterpret(correctedPrompt);

    return {
      originalPrompt,
      correctedPrompt,
      changed: correctedPrompt !== originalPrompt,
      topic: interpreted.topic,
      category: interpreted.category,
    };
  }

  private fallbackInterpret(prompt: string): WatchInterpretation {
    const p = normalizeWhitespace(prompt);
    const lower = p.toLocaleLowerCase('tr-TR');
    const category = inferFallbackCategory(p);

    const topic = p
      .replace(/\b(takip et|haber ver|bildir|çıktığında|çıkınca|olursa)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || p.slice(0, 120);

    return {
      topic,
      intent: p,
      category,
      aliases: [topic, topic.toLocaleLowerCase('tr-TR')].filter((value, index, all) => all.indexOf(value) === index),
      searchQueries: [p, topic, lower].filter((value, index, all) => value && all.indexOf(value) === index).slice(0, 5),
      notifyEvents: ['announcement', 'release_date', 'release', 'delay', 'availability'],
    };
  }

  private fallbackAnalyze(
    watch: Watch,
    article: Pick<Article, 'title' | 'description' | 'sourceName' | 'publishedAt'>,
  ): ArticleAnalysis {
    const hay = `${article.title} ${article.description ?? ''}`.toLocaleLowerCase('tr-TR');
    const tokens = [watch.topic, watch.intent, ...((watch.aliases as string[]) ?? [])]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(x => x.length >= 4);
    const unique = [...new Set(tokens)];
    const hits = unique.filter(t => hay.includes(t)).length;
    const relevanceScore = Math.min(
      1,
      hits / Math.max(2, Math.min(unique.length, 6)) +
        (hay.includes(watch.topic.toLocaleLowerCase('tr-TR')) ? 0.35 : 0),
    );
    const importantWords = [
      'açıklandı',
      'duyuruldu',
      'çıkış tarihi',
      'release date',
      'released',
      'ertelendi',
      'delayed',
      'yayınlandı',
      'satışa çıktı',
      'available',
      'confirmed',
      'resmi',
    ];
    const importanceScore = Math.min(1, 0.35 + importantWords.filter(word => hay.includes(word)).length * 0.18);
    const relevant = relevanceScore >= 0.35;
    const key =
      article.title
        .toLocaleLowerCase('tr-TR')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter(x => x.length > 3)
        .slice(0, 10)
        .join('_') || 'update';

    return {
      relevant,
      relevanceScore,
      importanceScore,
      isNewInformation: relevant && importanceScore >= 0.53,
      eventType: 'update',
      eventKey: key,
      summary: article.description?.slice(0, 220) || article.title,
    };
  }
}
