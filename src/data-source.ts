import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const isDev = (process.env.NODE_ENV || 'development') === 'development';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'api_proyecto_actualizada',
  entities: [
    __dirname + '/**/entities/*.entity.ts',
    __dirname + '/auth/entities/*.entity.ts',
    // Explicitly include sensores entities
    __dirname + '/sensores/entities/*.entity.ts',
    // Include all entities from all modules
    __dirname + '/**/entities/*.entity.ts',
    // Explicitly include specific entity files that might not be loaded
    __dirname + '/actividades/entities/actividad.entity.ts',
    __dirname + '/cultivos/entities/cultivo.entity.ts',
    __dirname + '/ingresos/entities/ingreso.entity.ts',
    __dirname + '/salidas/entities/salida.entity.ts',
    __dirname + '/inventario/entities/inventario.entity.ts',
    __dirname + '/usuarios/entities/usuario.entity.ts',
    __dirname + '/alertas/entities/alerta.entity.ts',
    __dirname + '/iot/entities/sensor.entity.ts',
    __dirname + '/iot/entities/reading.entity.ts',
    __dirname + '/iot/entities/broker.entity.ts',
  ],
  migrations: isDev
    ? [__dirname + '/database/migrations/*.ts']
    : [__dirname + '/../dist/database/migrations/*.js'],
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'false').toLowerCase() === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;