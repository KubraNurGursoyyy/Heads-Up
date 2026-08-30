import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { SourcesModule } from '../sources/sources.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [SourcesModule, AiModule, NotificationsModule],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
