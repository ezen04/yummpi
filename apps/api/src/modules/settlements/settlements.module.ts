import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

// OWNER ④ — 소비 항목 기반 분배 + 봉사료·부가세 자동 배분(F8·F9).
@Module({ controllers: [SettlementsController], providers: [SettlementsService] })
export class SettlementsModule {}
