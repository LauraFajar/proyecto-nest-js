import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './database/seeds/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('Obteniendo el servicio de seeder...');
  const seeder = app.get(SeederService);

  await seeder.seed();
  console.log('Seeding completo!');

  await app.close();
}

bootstrap();
