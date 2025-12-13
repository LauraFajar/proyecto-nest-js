import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CultivosService } from './cultivos.service';
import { CultivosController } from './cultivos.controller';
import { Cultivo } from './entities/cultivo.entity';
import { LotesModule } from '../lotes/lotes.module';
import { InsumosModule } from '../insumos/insumos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cultivo]), LotesModule, InsumosModule],
  controllers: [CultivosController],
  providers: [CultivosService],
  exports: [CultivosService],
})
export class CultivosModule {}
