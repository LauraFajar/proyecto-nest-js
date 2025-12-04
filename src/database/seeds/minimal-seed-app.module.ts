import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../../typeorm.config';
import { MinimalSeederModule } from './minimal-seeder.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), MinimalSeederModule],
})
export class MinimalSeedAppModule {}