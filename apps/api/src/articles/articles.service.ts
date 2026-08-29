import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  feed(userId: string, filter?: string, category?: string, watchId?: string) {
    return this.prisma.watchArticle.findMany({
      where: {
        watch: {
          userId,
          ...(category
            ? {
                category: {
                  equals: category,
                  mode: 'insensitive' as const,
                },
              }
            : {}),
          ...(watchId ? { id: watchId } : {}),
        },
        ...(filter === 'important'
          ? { importanceScore: { gte: 0.72 }, isNewInformation: true }
          : {}),
        ...(filter === 'unread' ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        article: true,
        watch: {
          select: {
            id: true,
            topic: true,
            category: true,
            notificationMode: true,
          },
        },
      },
    });
  }

  async markRead(userId: string, id: string) {
    const item = await this.prisma.watchArticle.findFirst({
      where: { id, watch: { userId } },
    });

    if (!item) throw new NotFoundException();

    return this.prisma.watchArticle.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
