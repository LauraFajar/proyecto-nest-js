import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasService } from './alertas.service';
import { AlertasController } from './alertas.controller';
import { Alerta } from './entities/alerta.entity';
import { AlertSchedulerService } from './services/alert-scheduler.service';
import { SensoresModule } from '../sensores/sensores.module';
import { InventarioModule } from '../inventario/inventario.module';
import { ActividadesModule } from '../actividades/actividades.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alerta]),
    SensoresModule,
    forwardRef(() => InventarioModule),
    ActividadesModule,
  ],
  controllers: [AlertasController],
  providers: [AlertasService, AlertSchedulerService],
  exports: [AlertasService],
})
export class AlertasModule {}
