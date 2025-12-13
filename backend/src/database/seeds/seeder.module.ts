import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from '../seeds/seeder.service';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Epa } from '../../epa/entities/epa.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Lote } from '../../lotes/entities/lote.entity';
import { Realiza } from '../../realiza/entities/realiza.entity';
import { Rol } from '../../rol/entities/rol.entity';
import { Sensor } from '../../sensores/entities/sensor.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Tiene } from '../../tiene/entities/tiene.entity';
import { Tiporol } from '../../tiporol/entities/tiporol.entity';
import { Tratamiento } from '../../tratamientos/entities/tratamiento.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Utiliza } from '../../utiliza/entities/utiliza.entity';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Salida } from '../../salidas/entities/salida.entity';
import { Movimiento } from '../../movimientos/entities/movimiento.entity';
import { ActividadSeeder } from '../seeds/actividad.seeder';
import { AlmacenSeeder } from '../seeds/almacen.seeder';
import { CategoriaSeeder } from '../seeds/categoria.seeder';
import { CultivoSeeder } from '../seeds/cultivo.seeder';
import { EpaSeeder } from '../seeds/epa.seeder';
import { InsumoSeeder } from '../seeds/insumo.seeder';
import { InventarioSeeder } from '../seeds/inventario.seeder';
import { LoteSeeder } from '../seeds/lote.seeder';
import { RealizaSeeder } from '../seeds/realiza.seeder';
import { RolSeeder } from '../seeds/rol.seeder';
import { SensorSeeder } from '../seeds/sensor.seeder';
import { SubloteSeeder } from '../seeds/sublote.seeder';
import { TieneSeeder } from '../seeds/tiene.seeder';
import { TipoRolSeeder } from '../seeds/tiporol.seeder';
import { TratamientoSeeder } from '../seeds/tratamiento.seeder';
import { UsuarioSeeder } from '../seeds/usuario.seeder';
import { UtilizaSeeder } from '../seeds/utiliza.seeder';
import { PermisoSeeder } from '../seeds/permiso.seeder';
import { IngresoSeeder } from '../seeds/ingreso.seeder';
import { SalidaSeeder } from '../seeds/salida.seeder';
import { MovimientoSeeder } from '../seeds/movimiento.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Actividad,
      Almacen,
      Categoria,
      Cultivo,
      Epa,
      Insumo,
      Inventario,
      Lote,
      Realiza,
      Rol,
      Sensor,
      Sublote,
      Tiene,
      Tiporol,
      Tratamiento,
      Usuario,
      Utiliza,
      Permiso,
      Ingreso,
      Salida,
      Movimiento,
    ]),
  ],
  providers: [
    SeederService,
    ActividadSeeder,
    AlmacenSeeder,
    CategoriaSeeder,
    CultivoSeeder,
    EpaSeeder,
    InsumoSeeder,
    InventarioSeeder,
    LoteSeeder,
    RealizaSeeder,
    RolSeeder,
    SensorSeeder,
    SubloteSeeder,
    TieneSeeder,
    TipoRolSeeder,
    TratamientoSeeder,
    UsuarioSeeder,
    UtilizaSeeder,
    PermisoSeeder,
    IngresoSeeder,
    SalidaSeeder,
    MovimientoSeeder,
  ],
})
export class SeederModule {}