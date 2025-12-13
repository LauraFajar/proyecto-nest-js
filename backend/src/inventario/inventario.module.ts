import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Inventario } from './entities/inventario.entity';
import { AlertasModule } from '../alertas/alertas.module';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario]),
    forwardRef(() => AlertasModule),
    PermisosModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService, RolesGuard],
  exports: [InventarioService],
})
export class InventarioModule {}
