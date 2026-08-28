import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../jobs/queue.service';
@Injectable()
export class WatchesService {
  constructor(private prisma: PrismaService, private ai: AiService, private queue: QueueService) {}
  list(userId: string) { return this.prisma.watch.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { watchArticles: true } } } }); }
  async create(userId: string, prompt: string, mode: NotificationMode = 'IMPORTANT_ONLY') {
    const parsed = await this.ai.interpretWatch(prompt);
    const watch = await this.prisma.watch.create({ data: { userId, prompt, topic: parsed.topic, intent: parsed.intent, category: parsed.category, aliases: parsed.aliases, searchQueries: parsed.searchQueries, notifyEvents: parsed.notifyEvents, notificationMode: mode, importanceThreshold: Number(process.env.AI_IMPORTANCE_THRESHOLD ?? 0.72) } });
    await this.queue.enqueueWatch(watch.id);
    return watch;
  }
  async update(userId: string, id: string, data: { active?: boolean; notificationMode?: NotificationMode; importanceThreshold?: number }) {
    await this.assertOwned(userId,id); return this.prisma.watch.update({ where: { id }, data });
  }
  async remove(userId: string, id: string) { await this.assertOwned(userId,id); await this.prisma.watch.delete({ where: { id } }); return { ok: true }; }
  async runNow(userId: string, id: string) { await this.assertOwned(userId,id); await this.queue.enqueueWatch(id, true); return { queued: true }; }
  private async assertOwned(userId:string,id:string){ const w=await this.prisma.watch.findFirst({where:{id,userId}}); if(!w) throw new NotFoundException('Takip bulunamadı.'); return w; }
}
