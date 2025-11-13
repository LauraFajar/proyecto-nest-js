import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilizaService } from './utiliza.service';
import { UtilizaController } from './utiliza.controller';
import { Utiliza } from './entities/utiliza.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Utiliza]), PermisosModule],
  controllers: [UtilizaController],
  providers: [UtilizaService, RolesGuard],
})
export class UtilizaModule {}
