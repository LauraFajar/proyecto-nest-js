import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealizaService } from './realiza.service';
import { RealizaController } from './realiza.controller';
import { Realiza } from './entities/realiza.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Realiza]), PermisosModule],
  controllers: [RealizaController],
  providers: [RealizaService, RolesGuard],
})
export class RealizaModule {}
