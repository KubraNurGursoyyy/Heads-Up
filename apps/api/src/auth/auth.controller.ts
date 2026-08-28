import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { CurrentUser, JwtUser } from './current-user.decorator';
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto.email, dto.password); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }
  @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @Post('logout') logout(@Body() dto: RefreshDto) { return this.auth.logout(dto.refreshToken); }
  @Get('me') @UseGuards(AuthGuard) me(@CurrentUser() user: JwtUser) { return { id: user.sub, email: user.email }; }
  @Delete('account') @UseGuards(AuthGuard) deleteAccount(@CurrentUser() user: JwtUser) { return this.auth.deleteAccount(user.sub); }
}
