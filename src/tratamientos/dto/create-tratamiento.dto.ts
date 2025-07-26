import { IsString, Length } from 'class-validator';

export class CreateTratamientoDto {
  @IsString()
  @Length(1, 50)
  descripcion: string;

  @IsString()
  @Length(1, 20)
  frecuencia: string;

}
