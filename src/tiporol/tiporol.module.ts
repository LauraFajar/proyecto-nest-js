import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiporolService } from './tiporol.service';
import { TiporolController } from './tiporol.controller';
import { Tiporol } from './entities/tiporol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tiporol])],
  controllers: [TiporolController],
  providers: [TiporolService],
})
export class TiporolModule {}
