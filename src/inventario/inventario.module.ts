import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Inventario } from './entities/inventario.entity';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario]),
    forwardRef(() => AlertasModule),
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
