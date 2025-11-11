import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSensoreDto {
  @IsString()
  tipo_sensor: string;

  @IsString()
  estado: string;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  valor_minimo: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  valor_maximo: number;

  @IsOptional()
  @IsString()
  unidad_medida?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;
}
