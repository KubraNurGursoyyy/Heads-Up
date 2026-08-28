import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get()
  health() { return { ok: true, service: 'headsup-api', now: new Date().toISOString() }; }
}
