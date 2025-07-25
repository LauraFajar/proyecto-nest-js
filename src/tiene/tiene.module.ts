import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TieneService } from './tiene.service';
import { TieneController } from './tiene.controller';
import { Tiene } from './entities/tiene.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tiene])],
  controllers: [TieneController],
  providers: [TieneService],
})
export class TieneModule {}
