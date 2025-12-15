import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { CropReportService } from './services/crop-report.service';
import { ReportExporterService } from './services/report-exporter.service';
import { Cultivo } from '../cultivos/entities/cultivo.entity';
import { Sublote } from '../sublotes/entities/sublote.entity';
import { Actividad } from '../actividades/entities/actividad.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Ingreso } from '../ingresos/entities/ingreso.entity';
import { Salida } from '../salidas/entities/salida.entity';
import { Alerta } from '../alertas/entities/alerta.entity';
import { Sensor } from '../sensores/entities/sensor.entity';
import { Lectura } from '../sensores/entities/lectura.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { ActividadesModule } from '../actividades/actividades.module';
import { CultivosModule } from '../cultivos/cultivos.module';
import { SensoresModule } from '../sensores/sensores.module';
import { InsumosModule } from '../insumos/insumos.module';
import { SalidasModule } from '../salidas/salidas.module';
import { UtilizaModule } from '../utiliza/utiliza.module';
import { Utiliza } from '../utiliza/entities/utiliza.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cultivo,
      Sublote,
      Actividad,
      Inventario,
      Ingreso,
      Salida,
      Alerta,
      Sensor,
      Lectura,
      Insumo,
      Utiliza,
    ]),
    ActividadesModule,
    CultivosModule,
    SensoresModule,
    InsumosModule,
    SalidasModule,
    UtilizaModule,
  ],
  controllers: [ReportsController],
  providers: [CropReportService, ReportExporterService],
  exports: [CropReportService, ReportExporterService],
})
export class ReportsModule {}
