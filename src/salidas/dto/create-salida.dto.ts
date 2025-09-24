import { IsString, Length, IsInt, IsOptional, IsDateString } from 'class-validator';

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
}
