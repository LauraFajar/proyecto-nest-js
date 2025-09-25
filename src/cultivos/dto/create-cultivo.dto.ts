import { 
  IsString, 
  IsOptional, 
  IsDateString, 
  IsNumber, 
  IsIn, 
  IsInt,
  Min,
  Max,
  IsDate,
  IsNotEmpty
} from 'class-validator';

export class CreateCultivoDto {
  @IsString()
  @IsNotEmpty({ message: 'El tipo de cultivo es obligatorio' })
  tipo_cultivo: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  id_lote: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  id_insumo?: number;

  @IsOptional()
  @IsDateString()
  fecha_siembra?: string;

  @IsOptional()
  @IsDateString()
  fecha_cosecha_estimada?: string;

  @IsOptional()
  @IsDateString()
  fecha_cosecha_real?: string;

  @IsOptional()
  @IsString()
  @IsIn(['sembrado', 'en_crecimiento', 'cosechado', 'perdido'], {
    message: 'El estado del cultivo no es válido'
  })
  estado_cultivo?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
