import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(SchedulerService.name);
  private timer?: NodeJS.Timeout;
  constructor(
    private p: PrismaService,
    private q: QueueService,
  ) {}

  onModuleInit() {
    if (
      process.env.HEADSUP_WORKER === '1' ||
      process.env.HEADSUP_SERVERLESS === '1' ||
      process.env.VERCEL
    )
      return;
    const minutes = Math.max(1, Number(process.env.WATCH_SCAN_MINUTES ?? 15));
    this.timer = setInterval(() => void this.schedule(), minutes * 60_000);
    setTimeout(() => void this.schedule(), 2_000);
    this.logger.log(`scheduler enabled: every ${minutes} minute(s)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async schedule() {
    const watches = await this.p.watch.findMany({ where: { active: true }, select: { id: true } });
    for (const w of watches) {
      try {
        await this.q.enqueueWatch(w.id, false, true);
      } catch (e) {
        this.logger.warn(String(e));
      }
    }
    if (watches.length) this.logger.log(`queued ${watches.length} active watches`);
  }
}
