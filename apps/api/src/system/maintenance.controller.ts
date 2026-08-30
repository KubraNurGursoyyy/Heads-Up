import {
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { SchedulerService } from '../jobs/scheduler.service';

@Controller('internal')
export class MaintenanceController {
  constructor(private readonly scheduler: SchedulerService) {}

  @Post('scan')
  @HttpCode(200)
  async scan(@Headers('x-headsup-cron-secret') secret?: string) {
    this.authorize(secret);

    await this.scheduler.schedule();

    return {
      ok: true,
      task: 'scan',
    };
  }

  private authorize(value?: string) {
    const expected = process.env.HEADSUP_CRON_SECRET;

    if (!expected || !value || value !== expected) {
      throw new UnauthorizedException();
    }
  }
}