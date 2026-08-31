import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SourcesModule } from '../sources/sources.module';
import { NotificationPolicyService } from './notification-policy.service';
import { PipelineRepository } from './pipeline.repository';
import { PipelineService } from './pipeline.service';

@Module({
  imports: [SourcesModule, AiModule, NotificationsModule],
  providers: [PipelineService, PipelineRepository, NotificationPolicyService],
  exports: [PipelineService],
})
export class PipelineModule {}
