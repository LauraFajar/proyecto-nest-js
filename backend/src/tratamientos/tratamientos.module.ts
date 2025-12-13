import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TratamientosService } from './tratamientos.service';
import { TratamientosController } from './tratamientos.controller';
import { Tratamiento } from './entities/tratamiento.entity';
import { TratamientoInsumo } from './entities/tratamiento-insumo.entity';
import { Epa } from '../epa/entities/epa.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tratamiento, TratamientoInsumo, Epa, Insumo, Inventario]), PermisosModule],
  controllers: [TratamientosController],
  providers: [TratamientosService, RolesGuard],
})
export class TratamientosModule {}
