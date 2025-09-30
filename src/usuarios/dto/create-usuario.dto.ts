import { IsString, Length, IsEmail, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsuarioDto {
  @IsString()
  @Length(1, 30)
  nombres: string;

  @IsEmail()
  @Length(1, 50)
  email: string;

  @IsString()
  @Length(6, 64)
  password: string;

  @IsString()
  @Length(1, 20)
  tipo_documento: string;

  @IsString()
  @Length(1, 20)
  numero_documento: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del rol debe ser un número' })
  @Min(1, { message: 'El ID del rol debe ser un número positivo' })
  id_rol?: number;
}

