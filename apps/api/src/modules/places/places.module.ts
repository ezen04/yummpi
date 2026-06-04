import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

// OWNER ② — 카카오 Local 검색·후보 캐시·Haversine 중간지점(F2·F4).
@Module({ controllers: [PlacesController], providers: [PlacesService] })
export class PlacesModule {}
