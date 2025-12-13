import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateAlertaDto {
  @IsNotEmpty()
  @IsString()
  tipo_alerta: string;

  @IsNotEmpty()
  @IsString()
  gravedad: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsString()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  hora: string;
}
