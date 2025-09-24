import { IsString, Length, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateActividadeDto {
  @IsString()
  @Length(1, 20)
  tipo_actividad: string;

  @IsDateString()
  fecha: string;

  @IsString()
  @Length(1, 50)
  responsable: string;

  @IsString()
  @Length(1, 50)
  detalles: string;

}