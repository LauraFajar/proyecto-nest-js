import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './entities/permiso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PermisosService } from './permisos.service';
import { PermisosController } from './permisos.controller';
import { PermisosGuard } from './guards/permisos.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso, Usuario])],
  controllers: [PermisosController],
  providers: [PermisosService, PermisosGuard, RolesGuard],
  exports: [PermisosService, PermisosGuard],
})
export class PermisosModule {}