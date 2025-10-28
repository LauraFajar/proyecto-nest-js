import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../app.module';
import { Seeder } from './seeder';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';
import { Tiporol } from 'src/tiporol/entities/tiporol.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([Tiporol, Rol, Usuario]),
  ],
  providers: [Seeder, TipoRolSeeder, RolSeeder, UsuarioSeeder],
})
export class SeederModule {}