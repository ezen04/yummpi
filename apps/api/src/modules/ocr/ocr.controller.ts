import { Controller, Get } from '@nestjs/common';
import { OcrService } from './ocr.service';

// OWNER ④ — CLOVA OCR 메뉴 추출 + 실패 fallback(F7).
@Controller('ocr')
export class OcrController {
  constructor(private readonly service: OcrService) {}

  @Get('health')
  health() {
    return { module: 'ocr', ok: true };
  }
}
