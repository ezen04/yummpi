import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

// OWNER ⑤ — 예약 상태 수동 관리(전→진행→완료) + 참석체크(F5·F6).
@Module({ controllers: [ReservationsController], providers: [ReservationsService] })
export class ReservationsModule {}
