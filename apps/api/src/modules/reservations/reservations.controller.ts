import { Controller, Get } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

// OWNER ⑤ — 예약 상태 수동 관리(전→진행→완료) + 참석체크(F5·F6).
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get('health')
  health() {
    return { module: 'reservations', ok: true };
  }
}
