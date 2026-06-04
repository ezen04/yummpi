import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

// OWNER ① — 모임 CRUD (F1). 초대 링크/게스트 입장.
@Module({ controllers: [MeetingsController], providers: [MeetingsService] })
export class MeetingsModule {}
