import { Injectable } from '@nestjs/common';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';
import { PermisoSeeder } from './permiso.seeder';

@Injectable()
export class MinimalSeederService {
  constructor(
    private readonly tipoRolSeeder: TipoRolSeeder,
    private readonly rolSeeder: RolSeeder,
    private readonly usuarioSeeder: UsuarioSeeder,
    private readonly permisoSeeder: PermisoSeeder,
  ) {}

  async seed() {
    console.log('Iniciando seeding mínimo (roles/usuarios/permisos)...');

    console.log('Sembrando tipos de rol...');
    await this.tipoRolSeeder.seed();

    console.log('Sembrando roles...');
    await this.rolSeeder.seed();

    console.log('Sembrando usuarios...');
    await this.usuarioSeeder.seed();

    console.log('Sembrando permisos...');
    await this.permisoSeeder.seed();

    console.log('Seeding mínimo completado!');
  }
}