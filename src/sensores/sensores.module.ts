import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';

import { MqttService } from './services/mqtt.service';
import { SensoresGateway } from './sensores.gateway';
import { ReportsService } from './services/reports.service';

import { Sensor } from './entities/sensor.entity';
import { Lectura } from './entities/lectura.entity';
import { Sublote } from '../sublotes/entities/sublote.entity';
import { Alerta } from '../alertas/entities/alerta.entity';
import { Cultivo } from '../cultivos/entities/cultivo.entity';

import { AlertasModule } from '../alertas/alertas.module';
import { IotModule } from '../iot/iot.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor, Lectura, Sublote, Alerta, Cultivo]),
    forwardRef(() => AlertasModule),
    IotModule,
  ],

  controllers: [SensoresController],

  providers: [
    SensoresService,
    MqttService,
    JwtAuthGuard,
    SensoresGateway,
    ReportsService,
  ],

  exports: [
    SensoresService,
    MqttService,
    SensoresGateway,
    ReportsService,
  ],
})
export class SensoresModule {}
