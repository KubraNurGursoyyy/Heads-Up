import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [JobsModule],
  controllers: [MaintenanceController],
})
export class SystemModule {}