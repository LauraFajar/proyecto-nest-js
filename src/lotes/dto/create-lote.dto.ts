import { IsString, Length, IsOptional } from 'class-validator';

export class CreateLoteDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  nombre_lote?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  descripcion?: string;
}

