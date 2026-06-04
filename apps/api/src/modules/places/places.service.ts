import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ② — 카카오 Local 검색·후보 캐시·Haversine 중간지점(F2·F4).
@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
