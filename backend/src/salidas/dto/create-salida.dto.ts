import {
  IsString,
  Length,
  IsInt,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalidaDto {
  @IsString()
  @Length(1, 30)
  nombre: string;

  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsInt()
  cantidad: number;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  observacion?: string;

  @IsOptional()
  @IsDateString()
  fecha_salida?: string;

  @IsOptional()
  @IsInt()
  id_cultivo?: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  unidad_medida?: string;

  @IsOptional()
  @IsInt()
  id_insumo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unidad?: number;
}
