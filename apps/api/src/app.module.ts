import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { PlacesModule } from './modules/places/places.module';
import { VotesModule } from './modules/votes/votes.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,          // ① 인증 (NextAuth↔JWT 브릿지, 게스트 닉네임)
    MeetingsModule,      // ① 모임 CRUD (F1)
    PlacesModule,        // ② 카카오 Local·장소추천·중간지점 (F2·F4)
    VotesModule,         // ③ 투표 정합성·장소확정 (F3·F4)
    RealtimeModule,      // ③ Socket.io 게이트웨이
    SettlementsModule,   // ④ 비용 분배 엔진 (F8·F9)
    OcrModule,           // ④ CLOVA OCR (F7)
    PaymentsModule,      // ④ 송금 딥링크 (F10)
    ReservationsModule,  // ⑤ 예약 상태·참석체크 (F5·F6)
    NotificationsModule, // ⑤ BullMQ 송금 독촉·메일
  ],
})
export class AppModule {}
