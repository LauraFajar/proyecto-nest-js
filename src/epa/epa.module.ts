import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpaService } from './epa.service';
import { EpaController } from './epa.controller';
import { Epa } from './entities/epa.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Epa]),
    UploadsModule,
    PermisosModule
  ],
  controllers: [EpaController],
  providers: [EpaService, RolesGuard],
  exports: [EpaService]
})
export class EpaModule {}
