import { Module } from '@nestjs/common';
import { ArticleDeduplicatorService } from './article-deduplicator.service';
import { GoogleNewsSourceService } from './google-news-source.service';
import { OpenLibrarySourceService } from './open-library-source.service';
import { SourcesService } from './sources.service';

@Module({
  providers: [
    SourcesService,
    GoogleNewsSourceService,
    OpenLibrarySourceService,
    ArticleDeduplicatorService,
  ],
  exports: [SourcesService],
})
export class SourcesModule {}
