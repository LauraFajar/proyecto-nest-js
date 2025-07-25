import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { Salida } from './entities/salida.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Salida])],
  controllers: [SalidasController],
  providers: [SalidasService],
})
export class SalidasModule {}

