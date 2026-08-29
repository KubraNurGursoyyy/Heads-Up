import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { WatchesService } from './watches.service';
import { CreateWatchDto, SuggestWatchDto, UpdateWatchDto } from './watches.dto';

@Controller('watches')
@UseGuards(AuthGuard)
export class WatchesController {
  constructor(private readonly watches: WatchesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.watches.list(user.sub);
  }

  @Get('categories')
  categories(@CurrentUser() user: JwtUser) {
    return this.watches.listCategories(user.sub);
  }

  @Post('suggest')
  suggest(@Body() dto: SuggestWatchDto) {
    return this.watches.suggest(dto.prompt);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateWatchDto) {
    return this.watches.create(user.sub, dto.prompt, dto.notificationMode, {
      topic: dto.topicHint,
      category: dto.categoryHint,
      requiredTerms: dto.requiredTerms,
    });
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateWatchDto) {
    return this.watches.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.watches.remove(user.sub, id);
  }

  @Post(':id/run')
  run(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.watches.runNow(user.sub, id);
  }
}
