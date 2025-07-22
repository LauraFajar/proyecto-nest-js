import { Module } from '@nestjs/common';
import { SublotesService } from './sublotes.service';
import { SublotesController } from './sublotes.controller';

@Module({
  controllers: [SublotesController],
  providers: [SublotesService],
})
export class SublotesModule {}
