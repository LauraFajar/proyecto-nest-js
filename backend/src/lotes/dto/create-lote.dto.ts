import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateLoteDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  nombre_lote: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @IsOptional()
  coordenadas?: number[][][];
}
