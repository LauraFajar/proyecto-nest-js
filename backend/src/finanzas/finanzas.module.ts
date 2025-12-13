import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanzasService } from './finanzas.service';
import { FinanzasController } from './finanzas.controller';
import { Ingreso } from '../ingresos/entities/ingreso.entity';
import { Salida } from '../salidas/entities/salida.entity';
import { Actividad } from '../actividades/entities/actividad.entity';
import { Cultivo } from '../cultivos/entities/cultivo.entity';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ingreso, Salida, Actividad, Cultivo]), PermisosModule],
  controllers: [FinanzasController],
  providers: [FinanzasService],
})
export class FinanzasModule {}