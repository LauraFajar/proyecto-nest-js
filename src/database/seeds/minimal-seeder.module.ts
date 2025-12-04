import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tiporol } from '../../tiporol/entities/tiporol.entity';
import { Rol } from '../../rol/entities/rol.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';
import { PermisoSeeder } from './permiso.seeder';
import { MinimalSeederService } from './minimal-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tiporol, Rol, Usuario, Permiso]),
  ],
  providers: [
    TipoRolSeeder,
    RolSeeder,
    UsuarioSeeder,
    PermisoSeeder,
    MinimalSeederService,
  ],
  exports: [MinimalSeederService],
})
export class MinimalSeederModule {}