import { BadRequestException, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Category } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { ArticlesService } from './articles.service';
@Controller('feed') @UseGuards(AuthGuard)
export class ArticlesController {
  constructor(private a: ArticlesService) {}
  @Get() feed(@CurrentUser() u: JwtUser, @Query('filter') filter?: string, @Query('category') rawCategory?: string, @Query('watchId') watchId?: string) {
    const allowed = Object.values(Category) as string[];
    if (rawCategory && !allowed.includes(rawCategory)) throw new BadRequestException('Geçersiz kategori.');
    return this.a.feed(u.sub, filter, rawCategory as Category | undefined, watchId);
  }
  @Patch(':id/read') read(@CurrentUser() u: JwtUser, @Param('id') id: string) { return this.a.markRead(u.sub, id); }
}
