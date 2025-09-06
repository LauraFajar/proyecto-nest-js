import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123789',
  database: 'api_proyecto',
  entities: ['dist/**/*.entity.js'], 
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, 
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;