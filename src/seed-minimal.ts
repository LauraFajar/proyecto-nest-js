import { NestFactory } from '@nestjs/core';
import { MinimalSeedAppModule } from './database/seeds/minimal-seed-app.module';
import { MinimalSeederService } from './database/seeds/minimal-seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MinimalSeedAppModule);

  console.log('Obteniendo el servicio de seeding mínimo...');
  const seeder = app.get(MinimalSeederService);

  await seeder.seed();
  console.log('Seeding mínimo completo!');

  await app.close();
}

bootstrap();