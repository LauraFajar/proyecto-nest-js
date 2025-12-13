import { Module } from '@nestjs/common';
import { IotGateway } from './services/iot.gateway';

@Module({
  providers: [IotGateway],
  exports: [IotGateway],
})
export class IotModule {}
