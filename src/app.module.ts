import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { dataSourceOptions } from './data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { AuthModule } from './auth/auth.module';
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
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsModule } from './uploads/uploads.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { PermisosModule } from './permisos/permisos.module';
import { SeederModule } from './database/seeds/seeder.module';
import { IotModule } from './iot/iot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_dashboard',
    ),
    TypeOrmModule.forRoot(dataSourceOptions),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisEnabled = (process.env.REDIS_ENABLED || 'false').toLowerCase() === 'true';
        if (!redisEnabled) {
          return {
            store: 'memory',
            ttl: 60,
          };
        }
        try {
          const store = await redisStore({
            socket: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
              // reduce aggressive reconnect noise; fail fast so we can fallback
              reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
            // default TTL for Redis cache
            ttl: 60 * 60,
          });
          return { store };
        } catch (error) {
          return {
            store: 'memory',
            ttl: 60,
          };
        }
      },
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
    AuthModule,
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
    UsuariosModule,
    UploadsModule,
    FinanzasModule,
    PermisosModule,
    SeederModule,
    IotModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    JwtStrategy,
  ],
})
export class AppModule {}
