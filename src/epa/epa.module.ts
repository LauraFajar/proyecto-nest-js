import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpaService } from './epa.service';
import { EpaController } from './epa.controller';
import { Epa } from './entities/epa.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Epa]),
    UploadsModule
  ],
  controllers: [EpaController],
  providers: [EpaService],
  exports: [EpaService]
})
export class EpaModule {}
