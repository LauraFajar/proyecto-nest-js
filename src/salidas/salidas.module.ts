import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { Salida } from './entities/salida.entity';
import { InventarioModule } from '../inventario/inventario.module';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Salida]),
    InventarioModule,
    PermisosModule,
  ],
  controllers: [SalidasController],
  providers: [SalidasService, RolesGuard],
})
export class SalidasModule {}

