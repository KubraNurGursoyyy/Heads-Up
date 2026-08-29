import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PipelineService } from '../pipeline/pipeline.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queue?: Queue;

  constructor(private readonly pipeline: PipelineService) {
    if (!this.isServerless()) {
      this.queue = new Queue('watch-checks', {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      });
    }
  }

  async enqueueWatch(
    watchId: string,
    force = false,
    allowInlineServerless = false,
  ) {
    if (this.isServerless()) {
      if (allowInlineServerless) {
        return this.pipeline.processWatch(watchId);
      }

      return { queued: false, deferredToScheduler: true };
    }

    const minutes = Math.max(1, Number(process.env.WATCH_SCAN_MINUTES ?? 15));
    const bucket = Math.floor(Date.now() / (minutes * 60 * 1000));

    return this.queue!.add(
      'check-watch',
      { watchId },
      {
        jobId: force ? undefined : `watch-${watchId}-${bucket}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 200,
      },
    );
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }

  private isServerless() {
    return process.env.HEADSUP_SERVERLESS === '1' || Boolean(process.env.VERCEL);
  }
}
