import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosService } from './ingresos.service';
import { IngresosController } from './ingresos.controller';
import { Ingreso } from './entities/ingreso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingreso])],
  controllers: [IngresosController],
  providers: [IngresosService],
})
export class IngresosModule {}
