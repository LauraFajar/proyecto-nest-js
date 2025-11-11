import { DataSource, DataSourceOptions } from 'typeorm';

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123789',
  database: process.env.DB_DATABASE || 'api_proyecto',
  entities: ['src/**/*.entity.ts'],
  migrations: [],
  synchronize: true,
  logging: false,
};

async function main() {
  const ds = new DataSource(options);
  try {
    console.log('Synchronizing schema from entities...');
    await ds.initialize();
    console.log('Schema synchronized successfully.');
  } catch (err) {
    console.error('Schema synchronization failed:', err);
    process.exitCode = 1;
  } finally {
    if (ds.isInitialized) await ds.destroy();
  }
}

main();