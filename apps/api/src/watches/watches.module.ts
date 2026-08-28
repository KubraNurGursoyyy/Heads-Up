import { Module, forwardRef } from '@nestjs/common';
import { WatchesController } from './watches.controller';
import { WatchesService } from './watches.service';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
@Module({ imports:[AiModule, forwardRef(()=>JobsModule)], controllers:[WatchesController], providers:[WatchesService], exports:[WatchesService] })
export class WatchesModule {}
