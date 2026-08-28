import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsModule } from '../jobs/jobs.module';
import { SystemPolicyService } from './system-policy.service';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [NotificationsModule, JobsModule],
  controllers: [MaintenanceController],
  providers: [SystemPolicyService],
  exports: [SystemPolicyService],
})
export class SystemModule {}
