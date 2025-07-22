import { Module } from '@nestjs/common';
import { RealizaService } from './realiza.service';
import { RealizaController } from './realiza.controller';

@Module({
  controllers: [RealizaController],
  providers: [RealizaService],
})
export class RealizaModule {}
