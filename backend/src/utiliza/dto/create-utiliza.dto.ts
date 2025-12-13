import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUtilizaDto {
  @IsNumber()
  @IsNotEmpty()
  id_actividades: number;

  @IsNumber()
  @IsNotEmpty()
  id_insumo: number;

  @IsString()
  @IsOptional()
  cantidad?: string;

  @IsString()
  @IsOptional()
  horas_uso?: string;
}
