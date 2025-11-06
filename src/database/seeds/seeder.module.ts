import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../app.module';
import { Seeder } from './seeder';
import { TipoRolSeeder } from './tiporol.seeder';
import { RolSeeder } from './rol.seeder';
import { UsuarioSeeder } from './usuario.seeder';
import { CategoriaSeeder } from './categoria.seeder';
import { AlmacenSeeder } from './almacen.seeder';
import { InsumoSeeder } from './insumo.seeder';
import { InventarioSeeder } from './inventario.seeder';
import { IngresoSeeder } from './ingreso.seeder';
import { MovimientoSeeder } from './movimiento.seeder';
import { Tiporol } from 'src/tiporol/entities/tiporol.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { Ingreso } from 'src/ingresos/entities/ingreso.entity';
import { Movimiento } from 'src/movimientos/entities/movimiento.entity';

@Module({
  imports: [
    AppModule,
    TypeOrmModule.forFeature([
      Tiporol,
      Rol,
      Usuario,
      Categoria,
      Almacen,
      Insumo,
      Inventario,
      Ingreso,
      Movimiento,
    ]),
  ],
  providers: [
    Seeder,
    TipoRolSeeder,
    RolSeeder,
    UsuarioSeeder,
    CategoriaSeeder,
    AlmacenSeeder,
    InsumoSeeder,
    InventarioSeeder,
    IngresoSeeder,
    MovimientoSeeder,
  ],
})
export class SeederModule {}