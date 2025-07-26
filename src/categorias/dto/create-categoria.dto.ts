import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoriaDto {
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: 'El nombre debe tener entre 1 y 30 caracteres.' })
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'La descripción debe tener entre 1 y 50 caracteres.' })
  descripcion: string;
}
