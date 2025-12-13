import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiporolService } from './tiporol.service';
import { TiporolController } from './tiporol.controller';
import { Tiporol } from './entities/tiporol.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tiporol]), PermisosModule],
  controllers: [TiporolController],
  providers: [TiporolService, RolesGuard],
})
export class TiporolModule {}
