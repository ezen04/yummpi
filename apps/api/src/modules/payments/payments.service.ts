import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ④ — 토스/카카오페이 송금 딥링크 생성·송금현황(F10).
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
