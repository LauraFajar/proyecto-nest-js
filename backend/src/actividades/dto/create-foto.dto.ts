import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFotoDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede tener más de 500 caracteres.' })
  descripcion?: string;
}