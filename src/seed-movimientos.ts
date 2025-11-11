import { NestFactory } from '@nestjs/core';
import { SeederModule } from './database/seeds/seeder.module';
import { InsumoSeeder } from './database/seeds/insumo.seeder';
import { InventarioSeeder } from './database/seeds/inventario.seeder';
import { MovimientoSeeder } from './database/seeds/movimiento.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  console.log('Seeding de insumos, inventario y movimientos...');

  const insumoSeeder = app.get(InsumoSeeder);
  const inventarioSeeder = app.get(InventarioSeeder);
  const movimientoSeeder = app.get(MovimientoSeeder);

  await insumoSeeder.seed();
  await inventarioSeeder.seed();
  await movimientoSeeder.seed();

  console.log('Seeding de movimientos completado!');
  await app.close();
}

bootstrap();