import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { Insumo } from './entities/insumo.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo]), PermisosModule],
  controllers: [InsumosController],
  providers: [InsumosService, RolesGuard],
  exports: [TypeOrmModule],
})
export class InsumosModule {}
