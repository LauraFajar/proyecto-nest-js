import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosService } from './movimientos.service';
import { MovimientosController } from './movimientos.controller';
import { Movimiento } from './entities/movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento])],
  controllers: [MovimientosController],
  providers: [MovimientosService],
})
export class MovimientosModule {}
