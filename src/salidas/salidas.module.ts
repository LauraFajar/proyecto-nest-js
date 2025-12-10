import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { Salida } from './entities/salida.entity';
import { InventarioModule } from '../inventario/inventario.module';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Inventario } from '../inventario/entities/inventario.entity';
import { AlertasModule } from '../alertas/alertas.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Salida, Inventario]), 
    forwardRef(() => InventarioModule),
    PermisosModule,
    forwardRef(() => AlertasModule), 
  ],
  controllers: [SalidasController],
  providers: [SalidasService, RolesGuard],
  exports: [SalidasService] 
})
export class SalidasModule {}

