import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadesService } from './actividades.service';
import { ActividadesController } from './actividades.controller';
import { Actividad } from './entities/actividad.entity';
import { FotoActividad } from './entities/foto-actividad.entity';
import { Utiliza } from '../utiliza/entities/utiliza.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { Salida } from '../salidas/entities/salida.entity';
import { MovimientosModule } from '../movimientos/movimientos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Actividad, FotoActividad, Utiliza, Insumo, Inventario, Salida]),
    UploadsModule,
    MovimientosModule,
  ],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}
