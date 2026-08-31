import { Injectable } from '@nestjs/common';
import { NotificationMode, type Watch } from '@prisma/client';
import type { ArticleAnalysis } from '../ai/ai.types';

@Injectable()
export class NotificationPolicyService {
  eventKey(raw: string, eventType: string, title: string) {
    const normalized = (raw || `${eventType}_${title}`)
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 180);

    return normalized || 'update';
  }

  shouldNotify(
    watch: Watch,
    analysis: ArticleAnalysis,
    publishedAt: Date | null,
    historical: boolean,
  ) {
    if (historical && !this.isRecent(publishedAt)) return false;
    if (watch.notificationMode === NotificationMode.OFF) return false;
    if (watch.notificationMode === NotificationMode.ALL_RELEVANT) return true;

    if (watch.notificationMode === NotificationMode.IMPORTANT_ONLY) {
      return analysis.isNewInformation && analysis.importanceScore >= watch.importanceThreshold;
    }

    const requestedEvents = ((watch.notifyEvents as string[]) ?? []).map(value =>
      value.toLowerCase(),
    );
    const eventType = analysis.eventType.toLowerCase();

    return (
      analysis.isNewInformation &&
      requestedEvents.some(value => eventType.includes(value) || value.includes(eventType))
    );
  }

  private isRecent(publishedAt: Date | null) {
    if (!publishedAt) return false;
    const maxAgeMs = 72 * 60 * 60 * 1000;
    return Date.now() - publishedAt.getTime() <= maxAgeMs;
  }
}
