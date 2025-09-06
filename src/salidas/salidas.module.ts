import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { Salida } from './entities/salida.entity';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Salida]),
    InventarioModule,
  ],
  controllers: [SalidasController],
  providers: [SalidasService],
})
export class SalidasModule {}

