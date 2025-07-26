import { IsString, Length, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CreateAlertaDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  tipo_alerta?: string;

  @IsDateString()
  fecha: string;

  @IsString()
  hora: string;

}
