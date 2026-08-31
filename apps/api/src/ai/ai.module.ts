import { Module } from '@nestjs/common';
import { ArticleAnalyzerService } from './article-analyzer.service';
import { GeminiClientService } from './gemini-client.service';
import { StructuredAiClient } from './structured-ai-client';
import { WatchUnderstandingService } from './watch-understanding.service';

@Module({
  providers: [
    GeminiClientService,
    {
      provide: StructuredAiClient,
      useExisting: GeminiClientService,
    },
    WatchUnderstandingService,
    ArticleAnalyzerService,
  ],
  exports: [WatchUnderstandingService, ArticleAnalyzerService],
})
export class AiModule {}
