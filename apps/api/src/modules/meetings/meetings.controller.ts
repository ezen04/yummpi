import { Controller, Get } from '@nestjs/common';
import { MeetingsService } from './meetings.service';

// OWNER ① — 모임 CRUD (F1). 초대 링크/게스트 입장.
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Get('health')
  health() {
    return { module: 'meetings', ok: true };
  }
}
