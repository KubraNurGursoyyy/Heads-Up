import type { Article, Watch } from '@prisma/client';
import {
  applyCommonTurkishCorrections,
  inferFallbackCategory,
  normalizeWhitespace,
} from '../common/text-normalization';
import type { ArticleAnalysis, WatchInterpretation, WatchSuggestion } from './ai.types';

export function buildLocalWatch(prompt: string): WatchInterpretation {
  const cleanPrompt = normalizeWhitespace(prompt);
  const lower = cleanPrompt.toLocaleLowerCase('tr-TR');
  const category = inferFallbackCategory(cleanPrompt);

  const topic =
    cleanPrompt
      .replace(/\b(takip et|haber ver|bildir|çıktığında|çıkınca|olursa)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || cleanPrompt.slice(0, 120);

  return {
    topic,
    intent: cleanPrompt,
    category,
    aliases: [topic, topic.toLocaleLowerCase('tr-TR')].filter(
      (value, index, all) => all.indexOf(value) === index,
    ),
    searchQueries: [cleanPrompt, topic, lower]
      .filter((value, index, all) => value && all.indexOf(value) === index)
      .slice(0, 5),
    notifyEvents: ['announcement', 'release_date', 'release', 'delay', 'availability'],
  };
}

export function suggestLocally(prompt: string): WatchSuggestion {
  const originalPrompt = normalizeWhitespace(prompt);
  const correctedPrompt = applyCommonTurkishCorrections(originalPrompt);
  const interpreted = buildLocalWatch(correctedPrompt);

  return {
    originalPrompt,
    correctedPrompt,
    changed: correctedPrompt !== originalPrompt,
    topic: interpreted.topic,
    category: interpreted.category,
  };
}

export function analyzeLocally(
  watch: Watch,
  article: Pick<Article, 'title' | 'description' | 'sourceName' | 'publishedAt'>,
): ArticleAnalysis {
  const haystack = `${article.title} ${article.description ?? ''}`.toLocaleLowerCase('tr-TR');
  const tokens = [watch.topic, watch.intent, ...((watch.aliases as string[]) ?? [])]
    .join(' ')
    .toLocaleLowerCase('tr-TR')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length >= 4);

  const uniqueTokens = [...new Set(tokens)];
  const hits = uniqueTokens.filter(token => haystack.includes(token)).length;
  const topicMatch = haystack.includes(watch.topic.toLocaleLowerCase('tr-TR')) ? 0.35 : 0;
  const relevanceScore = Math.min(
    1,
    hits / Math.max(2, Math.min(uniqueTokens.length, 6)) + topicMatch,
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
  const importanceScore = Math.min(
    1,
    0.35 + importantWords.filter(word => haystack.includes(word)).length * 0.18,
  );
  const relevant = relevanceScore >= 0.35;
  const eventKey =
    article.title
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(token => token.length > 3)
      .slice(0, 10)
      .join('_') || 'update';

  return {
    relevant,
    relevanceScore,
    importanceScore,
    isNewInformation: relevant && importanceScore >= 0.53,
    eventType: 'update',
    eventKey,
    summary: article.description?.slice(0, 220) || article.title,
  };
}
