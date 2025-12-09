import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilizaService } from './utiliza.service';
import { UtilizaController } from './utiliza.controller';
import { Utiliza } from './entities/utiliza.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { InventarioModule } from 'src/inventario/inventario.module';
import { Actividad } from 'src/actividades/entities/actividad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utiliza, Insumo, Inventario, Actividad]),
    PermisosModule,
    InventarioModule,
  ],
  controllers: [UtilizaController],
  providers: [UtilizaService, RolesGuard],
})
export class UtilizaModule {}
