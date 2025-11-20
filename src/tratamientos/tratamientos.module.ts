import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TratamientosService } from './tratamientos.service';
import { TratamientosController } from './tratamientos.controller';
import { Tratamiento } from './entities/tratamiento.entity';
import { Epa } from '../epa/entities/epa.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tratamiento, Epa]), PermisosModule],
  controllers: [TratamientosController],
  providers: [TratamientosService, RolesGuard],
})
export class TratamientosModule {}
