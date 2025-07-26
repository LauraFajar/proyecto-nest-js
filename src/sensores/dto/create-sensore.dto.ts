import { IsString, Length, IsIn } from 'class-validator';

export class CreateSensoreDto {
  @IsString()
  @Length(1, 20)
  tipo_sensor: string;

  @IsIn(['Activo', 'Inactivo'])
  estado: string;

}
