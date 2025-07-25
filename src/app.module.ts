import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriasModule } from './categorias/categorias.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { IngresosModule } from './ingresos/ingresos.module';
import { InsumosModule } from './insumos/insumos.module';
import { ActividadesModule } from './actividades/actividades.module';
import { AlertasModule } from './alertas/alertas.module';
import { CultivosModule } from './cultivos/cultivos.module';
import { EpaModule } from './epa/epa.module';
import { InventarioModule } from './inventario/inventario.module';
import { LotesModule } from './lotes/lotes.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { RealizaModule } from './realiza/realiza.module';
import { RolModule } from './rol/rol.module';
import { SalidasModule } from './salidas/salidas.module';
import { SensoresModule } from './sensores/sensores.module';
import { SublotesModule } from './sublotes/sublotes.module';
import { TieneModule } from './tiene/tiene.module';
import { TiporolModule } from './tiporol/tiporol.module';
import { TratamientosModule } from './tratamientos/tratamientos.module';
import { UtilizaModule } from './utiliza/utiliza.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    CategoriasModule,
    AlmacenesModule,
    IngresosModule, 
    InsumosModule, 
    ActividadesModule, 
    AlertasModule, 
    CultivosModule, 
    EpaModule, 
    InventarioModule, 
    LotesModule, 
    MovimientosModule, 
    RealizaModule, 
    RolModule, 
    SalidasModule, 
    SensoresModule, 
    SublotesModule, 
    TieneModule, 
    TiporolModule, 
    TratamientosModule, 
    UtilizaModule, 
    UsuariosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
