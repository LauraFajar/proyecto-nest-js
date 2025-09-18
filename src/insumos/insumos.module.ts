import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { Insumo } from './entities/insumo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo])],
  controllers: [InsumosController],
  providers: [InsumosService],
  exports: [TypeOrmModule],
})
export class InsumosModule {}
