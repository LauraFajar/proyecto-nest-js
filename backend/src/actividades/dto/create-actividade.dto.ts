import { IsString, IsDateString, IsNumber, IsOptional, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActividadeDto {
  @IsString()
  @IsIn(['siembra', 'riego', 'fertilizacion', 'poda', 'cosecha', 'otro'], {
    message: 'El tipo de actividad no es válido'
  })
  tipo_actividad: string;

  @IsDateString()
  fecha: string;

  @IsString()
  responsable: string;

  @IsNumber()
  @IsOptional()
  responsable_id?: number;

  @IsString()
  detalles: string;

  @IsNumber()
  id_cultivo: number;

  @IsOptional()
  @IsString()
  @IsIn(['pendiente', 'en_progreso', 'completada', 'cancelada'])
  estado?: string;

  @IsNumber()
  @IsOptional()
  costo_estimado?: number;

  @IsNumber()
  @IsOptional()
  costo_real?: number;

  @IsNumber()
  @IsOptional()
  horas_trabajadas?: number;

  @IsNumber()
  @IsOptional()
  tarifa_hora?: number;

  @IsNumber()
  @IsOptional()
  costo_mano_obra?: number;

  @IsNumber()
  @IsOptional()
  costo_maquinaria?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @IsOptional()
  fotografias?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecursoActividadDto)
  recursos?: RecursoActividadDto[];
}

export class RecursoActividadDto {
  @IsNumber()
  id_insumo: number;

  @IsNumber()
  @IsOptional()
  cantidad?: number;

  @IsNumber()
  @IsOptional()
  horas_uso?: number;

  @IsNumber()
  @IsOptional()
  costo_unitario?: number;
}
