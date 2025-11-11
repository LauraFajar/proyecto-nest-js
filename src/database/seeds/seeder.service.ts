import { Injectable } from '@nestjs/common';
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
import { MovimientoSeeder } from '../seeds/movimiento.seeder';

@Injectable()
export class SeederService {
  constructor(
    private readonly actividadSeeder: ActividadSeeder,
    private readonly almacenSeeder: AlmacenSeeder,
    private readonly categoriaSeeder: CategoriaSeeder,
    private readonly cultivoSeeder: CultivoSeeder,
    private readonly epaSeeder: EpaSeeder,
    private readonly insumoSeeder: InsumoSeeder,
    private readonly inventarioSeeder: InventarioSeeder,
    private readonly loteSeeder: LoteSeeder,
    private readonly realizaSeeder: RealizaSeeder,
    private readonly rolSeeder: RolSeeder,
    private readonly sensorSeeder: SensorSeeder,
    private readonly subloteSeeder: SubloteSeeder,
    private readonly tieneSeeder: TieneSeeder,
    private readonly tipoRolSeeder: TipoRolSeeder,
    private readonly tratamientoSeeder: TratamientoSeeder,
    private readonly usuarioSeeder: UsuarioSeeder,
    private readonly utilizaSeeder: UtilizaSeeder,
    private readonly movimientoSeeder: MovimientoSeeder,
  ) {}

  async seed() {
    console.log('Iniciando proceso de seeding...');

    // 1. Entidades sin dependencias
    console.log('Sembrando tipos de rol...');
    await this.tipoRolSeeder.seed();

    console.log('Sembrando almacenes...');
    await this.almacenSeeder.seed();

    console.log('Sembrando categorías...');
    await this.categoriaSeeder.seed();

    console.log('Sembrando EPA...');
    await this.epaSeeder.seed();

    console.log('Sembrando lotes...');
    await this.loteSeeder.seed();

    // 2. Entidades con dependencias de nivel 1
    console.log('Sembrando roles...');
    await this.rolSeeder.seed();

    console.log('Sembrando insumos (depende de Categoria y Almacen)...');
    await this.insumoSeeder.seed();

    console.log('Sembrando sublotes...');
    await this.subloteSeeder.seed();

    console.log('Sembrando cultivos (depende de Lote)...');
    await this.cultivoSeeder.seed();

    console.log('Sembrando tratamientos...');
    await this.tratamientoSeeder.seed();

    // 3. Entidades con dependencias de nivel 2
    console.log('Sembrando usuarios (depende de Rol)...');
    await this.usuarioSeeder.seed();

    console.log('Sembrando sensores (depende de Sublote)...');
    await this.sensorSeeder.seed();

    console.log('Sembrando inventario (depende de Insumo)...');
    await this.inventarioSeeder.seed();

    console.log('Sembrando movimientos (depende de Insumo)...');
    await this.movimientoSeeder.seed();

    console.log('Sembrando actividades (depende de Cultivo)...');
    await this.actividadSeeder.seed();

    // 4. Entidades de relación (muchos a muchos)
    console.log('Sembrando relaciones realiza (Usuario <-> Actividad)...');
    await this.realizaSeeder.seed();

    console.log('Sembrando relaciones tiene (Cultivo <-> Epa)...');
    await this.tieneSeeder.seed();

    console.log('Sembrando relaciones utiliza...');
    await this.utilizaSeeder.seed();

    console.log('Proceso de seeding completado con éxito!');
  }
}