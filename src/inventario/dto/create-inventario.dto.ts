import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateInventarioDto {
  @IsOptional()
  @IsInt()
  id_insumo?: number;

  @IsInt()
  cantidad_stock: number;

  @IsString()
  unidad_medida: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
