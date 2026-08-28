import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { WatchesService } from './watches.service';
import { CreateWatchDto, UpdateWatchDto } from './watches.dto';
@Controller('watches') @UseGuards(AuthGuard)
export class WatchesController {
  constructor(private watches: WatchesService) {}
  @Get() list(@CurrentUser() u: JwtUser){ return this.watches.list(u.sub); }
  @Post() create(@CurrentUser() u:JwtUser,@Body() d:CreateWatchDto){ return this.watches.create(u.sub,d.prompt,d.notificationMode); }
  @Patch(':id') update(@CurrentUser() u:JwtUser,@Param('id') id:string,@Body() d:UpdateWatchDto){ return this.watches.update(u.sub,id,d); }
  @Delete(':id') remove(@CurrentUser() u:JwtUser,@Param('id') id:string){ return this.watches.remove(u.sub,id); }
  @Post(':id/run') run(@CurrentUser() u:JwtUser,@Param('id') id:string){ return this.watches.runNow(u.sub,id); }
}
