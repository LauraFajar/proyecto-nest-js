
import { Injectable } from '@nestjs/common';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';

@Injectable()
export class Seeder {
  constructor(
    private readonly tipoRolSeeder: TipoRolSeeder,
    private readonly rolSeeder: RolSeeder,
    private readonly usuarioSeeder: UsuarioSeeder,
  ) {}

  async seed() {
    await this.tipoRolSeeder.seed();
    await this.rolSeeder.seed();
    await this.usuarioSeeder.seed();
  }
}
