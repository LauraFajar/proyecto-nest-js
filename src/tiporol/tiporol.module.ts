import { Module } from '@nestjs/common';
import { TiporolService } from './tiporol.service';
import { TiporolController } from './tiporol.controller';

@Module({
  controllers: [TiporolController],
  providers: [TiporolService],
})
export class TiporolModule {}
