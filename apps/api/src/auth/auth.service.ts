import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcryptjs';

import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async bootstrap(
    accessKey: string,
  ) {
    this.assertSingleUserKey(
      accessKey,
    );

    let user =
      await this.prisma.user.findFirst(
        {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            email: true,
          },
        },
      );

    if (!user) {
      user =
        await this.prisma.user.create(
          {
            data: {
              email:
                'single-user@headsup.local',

              passwordHash:
                await bcrypt.hash(
                  randomBytes(48)
                    .toString(
                      'base64url',
                    ),
                  12,
                ),
            },

            select: {
              id: true,
              email: true,
            },
          },
        );
    }

    return this.issueSession(
      user.id,
      user.email,
    );
  }

  async refresh(
    raw: string,
  ) {
    const tokenHash =
      this.hash(raw);

    const stored =
      await this.prisma
        .refreshToken
        .findUnique({
          where: {
            tokenHash,
          },

          include: {
            user: true,
          },
        });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt <=
        new Date()
    ) {
      throw new UnauthorizedException(
        'Oturum süresi dolmuş.',
      );
    }

    await this.prisma
      .refreshToken
      .update({
        where: {
          id: stored.id,
        },

        data: {
          revokedAt:
            new Date(),
        },
      });

    return this.issueSession(
      stored.user.id,
      stored.user.email,
    );
  }

  private assertSingleUserKey(
    received: string,
  ) {
    const expected =
      process.env
        .HEADSUP_SINGLE_USER_KEY;

    if (
      !expected ||
      expected.length < 32
    ) {
      throw new Error(
        'HEADSUP_SINGLE_USER_KEY en az 32 karakter olacak şekilde tanımlanmalı.',
      );
    }

    const receivedBuffer =
      Buffer.from(received);

    const expectedBuffer =
      Buffer.from(expected);

    if (
      receivedBuffer.length !==
        expectedBuffer.length ||
      !timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Geçersiz HeadsUp erişim anahtarı.',
      );
    }
  }

  private async issueSession(
    userId: string,
    email: string,
  ) {
    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_SECRET is required',
      );
    }

    const accessToken =
      await this.jwt.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret,
          expiresIn:
            (
              process.env
                .JWT_ACCESS_TTL ??
              '15m'
            ) as any,
        },
      );

    const refreshToken =
      randomBytes(48)
        .toString(
          'base64url',
        );

    const days = Number(
      process.env
        .REFRESH_TOKEN_DAYS ??
        30,
    );

    await this.prisma
      .refreshToken
      .create({
        data: {
          userId,

          tokenHash:
            this.hash(
              refreshToken,
            ),

          expiresAt:
            new Date(
              Date.now() +
                days *
                  86400000,
            ),
        },
      });

    return {
      user: {
        id: userId,
        email,
      },

      accessToken,
      refreshToken,
    };
  }

  private hash(
    value: string,
  ) {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }
}