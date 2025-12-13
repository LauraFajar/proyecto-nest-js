import { DataSource, DataSourceOptions } from 'typeorm';

const isDev = (process.env.NODE_ENV || 'development') === 'development';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123789',
  database: process.env.DB_DATABASE || 'api_proyecto',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: isDev
    ? [__dirname + '/database/migrations/*.ts']
    : [__dirname + '/../dist/database/migrations/*.js'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;