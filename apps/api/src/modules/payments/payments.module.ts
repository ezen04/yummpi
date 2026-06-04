import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// OWNER ④ — 토스/카카오페이 송금 딥링크 생성·송금현황(F10).
@Module({ controllers: [PaymentsController], providers: [PaymentsService] })
export class PaymentsModule {}
