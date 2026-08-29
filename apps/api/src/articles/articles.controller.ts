import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { ArticlesService } from './articles.service';

@Controller('feed')
@UseGuards(AuthGuard)
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  feed(
    @CurrentUser() user: JwtUser,
    @Query('filter') filter?: string,
    @Query('category') category?: string,
    @Query('watchId') watchId?: string,
  ) {
    return this.articles.feed(user.sub, filter, category?.trim() || undefined, watchId);
  }

  @Get('archive')
  archive(
    @CurrentUser() user: JwtUser,
    @Query('page') page?: string,
    @Query('category') category?: string,
    @Query('watchId') watchId?: string,
  ) {
    return this.articles.archive(
      user.sub,
      page,
      category?.trim() || undefined,
      watchId,
    );
  }

  @Patch(':id/read')
  read(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.articles.markRead(user.sub, id);
  }
}
