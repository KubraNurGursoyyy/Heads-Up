import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(
    userId: string,
    watchId: string,
    articleId: string,
    eventKey: string,
    url: string,
    title: string,
    body: string,
  ) {
    const existingEvent = await this.prisma.notification.findUnique({
      where: {
        watchId_eventKey: {
          watchId,
          eventKey,
        },
      },
    });

    if (existingEvent) {
      if (existingEvent.status === 'SENT') {
        return existingEvent;
      }

      if (
        existingEvent.status === 'PENDING' &&
        Date.now() - existingEvent.createdAt.getTime() < 5 * 60_000
      ) {
        return existingEvent;
      }

      return this.deliver(existingEvent);
    }

    const existingArticle = await this.prisma.notification.findUnique({
      where: {
        watchId_articleId: {
          watchId,
          articleId,
        },
      },
    });

    if (existingArticle) {
      return existingArticle.status === 'SENT'
        ? existingArticle
        : this.deliver(existingArticle);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        watchId,
        articleId,
        eventKey,
        url,
        title,
        body,
      },
    });

    return this.deliver(notification);
  }

  private async deliver(notification: Notification) {
    const devices = await this.prisma.device.findMany({
      where: {
        userId: notification.userId,
        enabled: true,
      },
    });

    if (!devices.length) {
      return this.prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          status: 'SKIPPED',
          error: 'No enabled push device',
        },
      });
    }

    const messages = devices.map(device => ({
      to: device.expoPushToken,
      title: notification.title,
      body: notification.body,
      sound: 'default',
      channelId: 'important-news',
      data: {
        watchId: notification.watchId,
        articleId: notification.articleId,
        url: notification.url,
      },
    }));

    let lastError = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(
          process.env.EXPO_PUSH_URL ??
            'https://exp.host/--/api/v2/push/send',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(messages),
          },
        );

        const text = await response.text();

        if (!response.ok) {
          throw new Error(`${response.status} ${text}`);
        }

        const payload = JSON.parse(text) as {
          data?:
            | Array<{
                status?: string;
                message?: string;
                details?: {
                  error?: string;
                };
              }>
            | {
                status?: string;
                message?: string;
                details?: {
                  error?: string;
                };
              };
        };

        const tickets = Array.isArray(payload.data)
          ? payload.data
          : payload.data
            ? [payload.data]
            : [];

        let okCount = 0;

        for (let index = 0; index < tickets.length; index++) {
          const ticket = tickets[index];

          if (ticket?.status === 'ok') {
            okCount++;
            continue;
          }

          if (
            ticket?.details?.error === 'DeviceNotRegistered' &&
            devices[index]
          ) {
            await this.prisma.device.update({
              where: {
                id: devices[index].id,
              },
              data: {
                enabled: false,
              },
            });
          }

          if (ticket?.message) {
            lastError = ticket.message;
          }
        }

        if (!tickets.length || okCount === 0) {
          throw new Error(
            lastError || 'Expo returned no successful push tickets',
          );
        }

        return this.prisma.notification.update({
          where: {
            id: notification.id,
          },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            error: null,
          },
        });
      } catch (error) {
        lastError = String(error);

        this.logger.warn(
          `push attempt ${attempt}/3 failed: ${lastError}`,
        );

        if (attempt < 3) {
          await new Promise(resolve =>
            setTimeout(resolve, 800 * attempt),
          );
        }
      }
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: 'FAILED',
        error: lastError.slice(0, 1000),
      },
    });
  }
}