import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class DevicesService {
  constructor(private p: PrismaService) {}
  register(userId: string, token: string, deviceName?: string) {
    return this.p.device.upsert({
      where: { expoPushToken: token },
      update: { userId, enabled: true, deviceName },
      create: { userId, expoPushToken: token, deviceName, platform: 'android' },
    });
  }
  disable(userId: string, token: string) {
    return this.p.device.updateMany({
      where: { userId, expoPushToken: token },
      data: { enabled: false },
    });
  }
}
