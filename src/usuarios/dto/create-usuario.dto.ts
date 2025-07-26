import { IsString, Length, IsEmail, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Length(1, 20)
  numero_documento?: string;

}

