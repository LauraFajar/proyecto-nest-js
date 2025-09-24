import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilizaService } from './utiliza.service';
import { UtilizaController } from './utiliza.controller';
import { Utiliza } from './entities/utiliza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Utiliza])],
  controllers: [UtilizaController],
  providers: [UtilizaService],
})
export class UtilizaModule {}
