import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ④ — CLOVA OCR 메뉴 추출 + 실패 fallback(F7).
@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
