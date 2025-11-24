import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { MqttService } from './services/mqtt.service';
import { Sensor } from './entities/sensor.entity';
import { Sublote } from '../sublotes/entities/sublote.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Sensor, Sublote])],
  controllers: [SensoresController],
  providers: [SensoresService, MqttService, JwtAuthGuard],
  exports: [SensoresService, MqttService],
})
export class SensoresModule {}
