import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { Insumo } from './entities/insumo.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Almacen } from '../almacenes/entities/almacen.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo, Categoria, Almacen]), PermisosModule, InventarioModule],
  controllers: [InsumosController],
  providers: [InsumosService, RolesGuard],
  exports: [TypeOrmModule],
})
export class InsumosModule {}
