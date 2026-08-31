import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { WatchUniquenessService } from './watch-uniqueness.service';
import { WatchesController } from './watches.controller';
import { WatchesRepository } from './watches.repository';
import { WatchesService } from './watches.service';

@Module({
  imports: [AuthModule, AiModule, PipelineModule, forwardRef(() => JobsModule)],
  controllers: [WatchesController],
  providers: [WatchesService, WatchesRepository, WatchUniquenessService],
  exports: [WatchesService],
})
export class WatchesModule {}
