import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

// OWNER ④ — CLOVA OCR 메뉴 추출 + 실패 fallback(F7).
@Module({ controllers: [OcrController], providers: [OcrService] })
export class OcrModule {}
