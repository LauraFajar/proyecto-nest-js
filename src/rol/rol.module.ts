import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { Rol } from './entities/rol.entity';
import { Tiporol } from '../tiporol/entities/tiporol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, Tiporol]),
  ],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService],
})
export class RolModule {}

