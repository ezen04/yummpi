import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';

// OWNER ④ — 토스/카카오페이 송금 딥링크 생성·송금현황(F10).
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('health')
  health() {
    return { module: 'payments', ok: true };
  }
}
