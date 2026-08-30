import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './devices.dto';
@Controller('devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private d: DevicesService) {}
  @Post() add(@CurrentUser() u: JwtUser, @Body() b: RegisterDeviceDto) {
    return this.d.register(u.sub, b.expoPushToken, b.deviceName);
  }
  @Delete() del(@CurrentUser() u: JwtUser, @Body() b: RegisterDeviceDto) {
    return this.d.disable(u.sub, b.expoPushToken);
  }
}
