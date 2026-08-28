import { createHash } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

type PolicySource = { service: string; url: string; label: string };

const POLICY_SOURCES: PolicySource[] = [
  { service: 'gemini-api', label: 'Gemini API', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
  { service: 'expo-push', label: 'Expo Push Notifications', url: 'https://docs.expo.dev/push-notifications/faq/' },
];

@Injectable()
export class SystemPolicyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemPolicyService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.HEADSUP_WORKER === '1' || process.env.HEADSUP_SERVERLESS === '1' || process.env.VERCEL) return;
    if ((process.env.POLICY_MONITOR_ENABLED ?? 'true').toLowerCase() !== 'true') return;

    const minutes = Math.max(60, Number(process.env.POLICY_MONITOR_MINUTES ?? 60));
    this.timer = setInterval(() => void this.checkAll(), minutes * 60_000);
    setTimeout(() => void this.checkAll(), 15_000);
    this.logger.log(`free-tier policy monitor enabled: every ${minutes} minute(s)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private normalize(html: string) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private pricingExcerpt(text: string) {
    const patterns = [/free tier/gi, /free/gi, /pricing/gi, /price/gi, /billing/gi, /paid/gi, /cost/gi, /quota/gi, /rate limit/gi, /charge/gi];
    const pieces = new Set<string>();
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const index = match.index ?? 0;
        pieces.add(text.slice(Math.max(0, index - 280), Math.min(text.length, index + 520)));
        if (pieces.size >= 40) break;
      }
      if (pieces.size >= 40) break;
    }
    return [...pieces].join('\n').slice(0, 30_000) || text.slice(0, 30_000);
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async checkAll() {
    for (const source of POLICY_SOURCES) {
      try {
        await this.check(source);
      } catch (error) {
        this.logger.warn(`${source.service} policy check failed: ${String(error)}`);
      }
    }
  }

  private async check(source: PolicySource) {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'HeadsUp-FreeTier-Monitor/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const normalized = this.normalize(await response.text());
    const excerpt = this.pricingExcerpt(normalized);
    const fingerprint = this.hash(excerpt.toLowerCase());
    const previous = await this.prisma.policySnapshot.findUnique({ where: { service: source.service } });

    if (!previous) {
      await this.prisma.policySnapshot.create({
        data: { service: source.service, url: source.url, fingerprint, excerpt, checkedAt: new Date() },
      });
      this.logger.log(`${source.service}: policy baseline saved`);
      return;
    }

    if (previous.fingerprint === fingerprint) {
      await this.prisma.policySnapshot.update({ where: { service: source.service }, data: { checkedAt: new Date() } });
      return;
    }

    await this.prisma.policySnapshot.update({
      where: { service: source.service },
      data: { url: source.url, fingerprint, excerpt, checkedAt: new Date() },
    });

    await this.notifications.sendSystemToAll(
      'HeadsUp ücretsiz servis uyarısı',
      `${source.label} ücretsiz kullanım/fiyatlandırma politikasında değişiklik algılandı. Detayları kontrol et.`,
      source.url,
      `policy:${source.service}:${fingerprint.slice(0, 16)}`,
    );
    this.logger.warn(`${source.service}: pricing/free-tier relevant content changed`);
  }
}
