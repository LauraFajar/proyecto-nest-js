import { NestFactory } from '@nestjs/core';
import { SeederService } from './database/seeds/seeder.service';
import { SeedAppModule } from './database/seeds/seed-app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedAppModule);

  console.log('Obteniendo el servicio de seeder...');
  const seeder = app.get(SeederService);

  await seeder.seed();
  console.log('Seeding completo!');

  await app.close();
}

bootstrap();