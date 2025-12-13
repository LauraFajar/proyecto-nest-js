import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadesService } from './actividades.service';
import { ActividadesController } from './actividades.controller';
import { Actividad } from './entities/actividad.entity';
import { FotoActividad } from './entities/foto-actividad.entity';
import { Utiliza } from '../utiliza/entities/utiliza.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { MovimientosModule } from '../movimientos/movimientos.module';
import { SalidasModule } from '../salidas/salidas.module';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Actividad,
      FotoActividad,
      Utiliza,
      Insumo,
      Inventario,
    ]),
    UploadsModule,
    MovimientosModule,
    forwardRef(() => SalidasModule),
    forwardRef(() => AlertasModule),
  ],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}
