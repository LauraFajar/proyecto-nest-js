import { Module } from '@nestjs/common';
import { TieneService } from './tiene.service';
import { TieneController } from './tiene.controller';

@Module({
  controllers: [TieneController],
  providers: [TieneService],
})
export class TieneModule {}
