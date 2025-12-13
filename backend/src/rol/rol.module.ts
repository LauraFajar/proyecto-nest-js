import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { Rol } from './entities/rol.entity';
import { Tiporol } from '../tiporol/entities/tiporol.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Tiporol]), PermisosModule],
  controllers: [RolController],
  providers: [RolService, RolesGuard],
  exports: [RolService],
})
export class RolModule {}
