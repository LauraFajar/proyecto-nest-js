
import { NestFactory } from '@nestjs/core';
import { Seeder } from './seeder';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const seeder = appContext.get(Seeder);

  try {
    await seeder.seed();
    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
