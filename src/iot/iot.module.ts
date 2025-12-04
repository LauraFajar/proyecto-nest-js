import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IotController } from './controllers/iot.controller';
import { IotService } from './services/iot.service';
import { ComprehensiveReportsService } from './services/comprehensive-reports.service';
import { IotGateway } from './services/iot.gateway';
import { Sensor, SensorSchema } from './entities/sensor.entity';
import { Reading, ReadingSchema } from './entities/reading.entity';
import { Broker, BrokerSchema } from './entities/broker.entity';
import { Actividad } from '../actividades/entities/actividad.entity';
import { Cultivo } from '../cultivos/entities/cultivo.entity';
import { Ingreso } from '../ingresos/entities/ingreso.entity';
import { Salida } from '../salidas/entities/salida.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Alerta } from '../alertas/entities/alerta.entity';
import { FinanzasService } from '../finanzas/finanzas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sensor.name, schema: SensorSchema },
      { name: Reading.name, schema: ReadingSchema },
      { name: Broker.name, schema: BrokerSchema },
    ]),
    TypeOrmModule.forFeature([
      Actividad,
      Cultivo,
      Ingreso,
      Salida,
      Inventario,
      Usuario,
      Alerta
    ]),
  ],
  controllers: [IotController],
  providers: [IotService, ComprehensiveReportsService, IotGateway, FinanzasService],
  exports: [IotService, ComprehensiveReportsService, IotGateway],
})
export class IotModule {}