import { IsString, Length, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateSalidaDto {
  @IsInt()
  cantidad: number;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  observacion?: string;

  @IsOptional()
  @IsDateString()
  fecha_salida?: string;

  // Vinculación con Insumo por ID numérico
  @IsInt()
  id_insumo: number;
}
