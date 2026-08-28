import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı.');
    const user = await this.prisma.user.create({
      data: { email: normalized, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, email: true },
    });
    return this.issueSession(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }
    return this.issueSession(user.id, user.email);
  }

  async refresh(raw: string) {
    const tokenHash = this.hash(raw);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) throw new UnauthorizedException('Oturum süresi dolmuş.');
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueSession(stored.user.id, stored.user.email);
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  async logout(raw: string) {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hash(raw), revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  private async issueSession(userId: string, email: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required');
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret, expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as any },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(process.env.REFRESH_TOKEN_DAYS ?? 30);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hash(refreshToken), expiresAt: new Date(Date.now() + days * 86400000) },
    });
    return { user: { id: userId, email }, accessToken, refreshToken };
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
