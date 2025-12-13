import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SublotesService } from './sublotes.service';
import { SublotesController } from './sublotes.controller';
import { Sublote } from './entities/sublote.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { Sensor } from '../sensores/entities/sensor.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Sublote, Lote, Sensor]), PermisosModule],
  controllers: [SublotesController],
  providers: [SublotesService, RolesGuard],
})
export class SublotesModule {}
