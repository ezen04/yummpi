import { Controller, Get } from '@nestjs/common';
import { SettlementsService } from './settlements.service';

// OWNER ④ — 소비 항목 기반 분배 + 봉사료·부가세 자동 배분(F8·F9).
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}

  @Get('health')
  health() {
    return { module: 'settlements', ok: true };
  }
}
