import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SublotesService } from './sublotes.service';
import { SublotesController } from './sublotes.controller';
import { Sublote } from './entities/sublote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sublote])],
  controllers: [SublotesController],
  providers: [SublotesService],
})
export class SublotesModule {}
