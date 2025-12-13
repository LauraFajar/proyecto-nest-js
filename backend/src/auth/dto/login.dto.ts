import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  numero_documento: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}