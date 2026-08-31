import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.watch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { watchArticles: true } } },
    });
  }

  async categoryNames(userId: string) {
    const watches = await this.prisma.watch.findMany({
      where: { userId },
      select: { category: true },
    });
    return watches.map(watch => watch.category);
  }

  matchKeys(userId: string, excludeId?: string) {
    return this.prisma.watch.findMany({
      where: {
        userId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { prompt: true, requiredTerms: true },
    });
  }

  findOwned(userId: string, id: string) {
    return this.prisma.watch.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.WatchUncheckedCreateInput) {
    return this.prisma.watch.create({ data });
  }

  update(id: string, data: Prisma.WatchUpdateInput) {
    return this.prisma.watch.update({
      where: { id },
      data,
      include: { _count: { select: { watchArticles: true } } },
    });
  }

  async remove(id: string) {
    await this.prisma.$transaction(async tx => {
      await tx.notification.deleteMany({ where: { watchId: id } });
      await tx.watchArticle.deleteMany({ where: { watchId: id } });
      await tx.watch.delete({ where: { id } });
    });
  }
}
