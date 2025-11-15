import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosService } from './movimientos.service';
import { MovimientosController } from './movimientos.controller';
import { Movimiento } from './entities/movimiento.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Insumo]), PermisosModule],
  controllers: [MovimientosController],
  providers: [MovimientosService, RolesGuard],
})
export class MovimientosModule {}
