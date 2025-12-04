import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../../typeorm.config';
import { SeederModule } from './seeder.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), SeederModule],
})
export class SeedAppModule {}