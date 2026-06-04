import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ① — 모임 CRUD (F1). 초대 링크/게스트 입장.
@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
