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

export type StructuredJsonSchema = Record<string, unknown>;
