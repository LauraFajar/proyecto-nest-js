import { IsString, Length, IsEmail, IsOptional, IsNumber } from 'class-validator';

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
  @IsNumber()
  id_rol?: number;
}

