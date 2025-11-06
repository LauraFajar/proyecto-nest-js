
import { Injectable } from '@nestjs/common';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';
import { CategoriaSeeder } from './categoria.seeder';
import { AlmacenSeeder } from './almacen.seeder';
import { InsumoSeeder } from './insumo.seeder';
import { InventarioSeeder } from './inventario.seeder';
import { IngresoSeeder } from './ingreso.seeder';
import { MovimientoSeeder } from './movimiento.seeder';

@Injectable()
export class Seeder {
  constructor(
    private readonly tipoRolSeeder: TipoRolSeeder,
    private readonly rolSeeder: RolSeeder,
    private readonly usuarioSeeder: UsuarioSeeder,
    private readonly categoriaSeeder: CategoriaSeeder,
    private readonly almacenSeeder: AlmacenSeeder,
    private readonly insumoSeeder: InsumoSeeder,
    private readonly inventarioSeeder: InventarioSeeder,
    private readonly ingresoSeeder: IngresoSeeder,
    private readonly movimientoSeeder: MovimientoSeeder,
  ) {}

  async seed() {
    await this.tipoRolSeeder.seed();
    await this.rolSeeder.seed();
    await this.usuarioSeeder.seed();
    await this.categoriaSeeder.seed();
    await this.almacenSeeder.seed();
    await this.insumoSeeder.seed();
    await this.inventarioSeeder.seed();
    await this.ingresoSeeder.seed();
    await this.movimientoSeeder.seed();
  }
}
