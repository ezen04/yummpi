import { Controller, Get } from '@nestjs/common';
import { PlacesService } from './places.service';

// OWNER ② — 카카오 Local 검색·후보 캐시·Haversine 중간지점(F2·F4).
@Controller('places')
export class PlacesController {
  constructor(private readonly service: PlacesService) {}

  @Get('health')
  health() {
    return { module: 'places', ok: true };
  }
}
