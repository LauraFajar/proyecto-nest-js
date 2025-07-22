import { Module } from '@nestjs/common';
import { UtilizaService } from './utiliza.service';
import { UtilizaController } from './utiliza.controller';

@Module({
  controllers: [UtilizaController],
  providers: [UtilizaService],
})
export class UtilizaModule {}
