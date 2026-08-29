import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  BootstrapDto,
  RefreshDto,
} from './auth.dto';
import { AuthGuard } from './auth.guard';
import {
  CurrentUser,
  JwtUser,
} from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
  ) {}

  @Post('bootstrap')
  bootstrap(
    @Body() dto: BootstrapDto,
  ) {
    return this.auth.bootstrap(
      dto.accessKey,
    );
  }

  @Post('refresh')
  refresh(
    @Body() dto: RefreshDto,
  ) {
    return this.auth.refresh(
      dto.refreshToken,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(
    @CurrentUser()
    user: JwtUser,
  ) {
    return {
      id: user.sub,
      email: user.email,
    };
  }
}