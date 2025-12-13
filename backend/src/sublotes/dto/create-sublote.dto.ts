import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsNumber,
  Length,
} from 'class-validator';

export class CreateSubloteDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  ubicacion: string;

  @IsNumber()
  @IsNotEmpty()
  id_lote: number;

  @IsArray()
  @IsOptional()
  coordenadas?: number[][][];
}
