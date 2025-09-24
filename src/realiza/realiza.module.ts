import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealizaService } from './realiza.service';
import { RealizaController } from './realiza.controller';
import { Realiza } from './entities/realiza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Realiza])],
  controllers: [RealizaController],
  providers: [RealizaService],
})
export class RealizaModule {}
