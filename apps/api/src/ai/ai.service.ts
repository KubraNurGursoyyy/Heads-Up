import { Injectable, Logger } from '@nestjs/common';
import { Article, Category, Watch } from '@prisma/client';

export type WatchInterpretation = {
  topic: string;
  intent: string;
  category: Category;
  aliases: string[];
  searchQueries: string[];
  notifyEvents: string[];
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

  async interpretWatch(prompt: string): Promise<WatchInterpretation> {
    if (!this.canUseGemini()) return this.fallbackInterpret(prompt);

    try {
      return await this.callStructured<WatchInterpretation>(
        `Kullanıcının takip isteğini yapılandır. Kullanıcı Türkçe yazabilir. topic kanonik konu adı, intent neyi beklediğinin kısa açıklaması olsun. category yalnız GAME, BOOK, MOVIE_TV, TECHNOLOGY, GENERAL. aliases en çok 8 ad/alternatif, searchQueries en çok 5 etkili web haber araması, notifyEvents en çok 8 kısa snake_case olay türü üret (ör. release_date, delay, availability).`,
        prompt,
        {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            intent: { type: 'string' },
            category: { type: 'string', enum: ['GAME', 'BOOK', 'MOVIE_TV', 'TECHNOLOGY', 'GENERAL'] },
            aliases: { type: 'array', items: { type: 'string' } },
            searchQueries: { type: 'array', items: { type: 'string' } },
            notifyEvents: { type: 'array', items: { type: 'string' } },
          },
          required: ['topic', 'intent', 'category', 'aliases', 'searchQueries', 'notifyEvents'],
        },
      );
    } catch (error) {
      this.logger.warn(`Gemini watch interpretation unavailable; local fallback used: ${String(error)}`);
      return this.fallbackInterpret(prompt);
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
        `Bir haberin kullanıcının takibiyle ilişkisini değerlendir. relevanceScore ve importanceScore 0..1 olsun. isNewInformation, başlık/açıklamanın takip açısından gerçek bir yeni gelişme iddia edip etmediğini göstersin. eventType kısa snake_case olay türü. eventKey aynı gerçek dünya gelişmesini farklı siteler anlatsa da aynı olacak kısa ve kararlı bir kimlik olsun (ör. pc_release_date_2027_announced); farklı bir gelişmeyse farklı olsun. summary en fazla 2 kısa Türkçe cümle. Sadece başlık/açıklamada desteklenen bilgiye dayan; uydurma yapma.`,
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

  private fallbackInterpret(prompt: string): WatchInterpretation {
    const p = prompt.trim();
    const lower = p.toLocaleLowerCase('tr');
    let category: Category = 'GENERAL';
    if (/oyun|game|steam|playstation|xbox|pc\b/.test(lower)) category = 'GAME';
    else if (/kitap|roman|baskı|yayınevi|yazar/.test(lower)) category = 'BOOK';
    else if (/film|dizi|sezon|vizyon|sinema/.test(lower)) category = 'MOVIE_TV';
    else if (/telefon|işlemci|yazılım|sürüm|android|iphone|teknoloji/.test(lower)) category = 'TECHNOLOGY';

    const topic = p
      .replace(/\b(takip et|haber ver|bildir|çıktığında|çıkınca|olursa)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || p.slice(0, 120);

    return {
      topic,
      intent: p,
      category,
      aliases: [topic],
      searchQueries: [p, topic],
      notifyEvents: ['announcement', 'release_date', 'release', 'delay', 'availability'],
    };
  }

  private fallbackAnalyze(
    watch: Watch,
    article: Pick<Article, 'title' | 'description' | 'sourceName' | 'publishedAt'>,
  ): ArticleAnalysis {
    const hay = `${article.title} ${article.description ?? ''}`.toLocaleLowerCase('tr');
    const tokens = [watch.topic, watch.intent, ...((watch.aliases as string[]) ?? [])]
      .join(' ')
      .toLocaleLowerCase('tr')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(x => x.length >= 4);
    const unique = [...new Set(tokens)];
    const hits = unique.filter(t => hay.includes(t)).length;
    const relevanceScore = Math.min(
      1,
      hits / Math.max(2, Math.min(unique.length, 6)) +
        (hay.includes(watch.topic.toLocaleLowerCase('tr')) ? 0.35 : 0),
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
        .toLocaleLowerCase('tr')
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
