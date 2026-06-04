import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { GuestJoinInput } from '@gatherflow/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('guest')
  guest(@Body() body: GuestJoinInput) {
    return this.auth.guestJoin(body);
  }
}
