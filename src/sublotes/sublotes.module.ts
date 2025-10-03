import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SublotesService } from './sublotes.service';
import { SublotesController } from './sublotes.controller';
import { Sublote } from './entities/sublote.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { Sensor } from '../sensores/entities/sensor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sublote, Lote, Sensor])],
  controllers: [SublotesController],
  providers: [SublotesService],
})
export class SublotesModule {}
