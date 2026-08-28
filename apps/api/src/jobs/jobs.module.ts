import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { SchedulerService } from './scheduler.service';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [forwardRef(() => PipelineModule)],
  providers: [QueueService, SchedulerService],
  exports: [QueueService, SchedulerService],
})
export class JobsModule {}
