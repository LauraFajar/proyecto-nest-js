import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpaService } from './epa.service';
import { EpaController } from './epa.controller';
import { Epa } from './entities/epa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Epa])],
  controllers: [EpaController],
  providers: [EpaService],
})
export class EpaModule {}
