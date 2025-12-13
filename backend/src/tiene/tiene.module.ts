import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TieneService } from './tiene.service';
import { TieneController } from './tiene.controller';
import { Tiene } from './entities/tiene.entity';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tiene]), PermisosModule],
  controllers: [TieneController],
  providers: [TieneService, RolesGuard],
})
export class TieneModule {}
