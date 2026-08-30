import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { WatchesController } from './watches.controller';
import { WatchesService } from './watches.service';

@Module({
  imports: [AuthModule, AiModule, PipelineModule, forwardRef(() => JobsModule)],
  controllers: [WatchesController],
  providers: [WatchesService],
  exports: [WatchesService],
})
export class WatchesModule {}
