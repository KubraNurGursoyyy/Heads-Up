import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ARCHIVE_PAGE_SIZE,
  LIVE_FEED_SIZE,
  archiveSkip,
  archiveTotal,
  archiveTotalPages,
  normalizeArchivePage,
} from './archive-pagination';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  feed(userId: string, filter?: string, category?: string, watchId?: string) {
    return this.prisma.watchArticle.findMany({
      where: this.buildWhere(userId, filter, category, watchId),
      orderBy: [
        { article: { publishedAt: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: LIVE_FEED_SIZE,
      include: this.includeRelations(),
    });
  }

  async archive(userId: string, pageInput?: string, category?: string, watchId?: string) {
    const page = normalizeArchivePage(pageInput);
    const where = this.buildWhere(userId, undefined, category, watchId);
    const totalItems = await this.prisma.watchArticle.count({ where });
    const total = archiveTotal(totalItems);
    const totalPages = archiveTotalPages(totalItems);
    const safePage = Math.min(page, totalPages);

    const items = total
      ? await this.prisma.watchArticle.findMany({
          where,
          orderBy: [
            { article: { publishedAt: 'desc' } },
            { createdAt: 'desc' },
          ],
          skip: archiveSkip(safePage),
          take: ARCHIVE_PAGE_SIZE,
          include: this.includeRelations(),
        })
      : [];

    return {
      items,
      page: safePage,
      pageSize: ARCHIVE_PAGE_SIZE,
      total,
      totalPages,
    };
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

  private buildWhere(
    userId: string,
    filter?: string,
    category?: string,
    watchId?: string,
  ) {
    return {
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
    };
  }

  private includeRelations() {
    return {
      article: true,
      watch: {
        select: {
          id: true,
          topic: true,
          category: true,
          notificationMode: true,
          requiredTerms: true,
        },
      },
    } as const;
  }
}
