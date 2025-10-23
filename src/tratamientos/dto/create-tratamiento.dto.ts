import { IsString, Length, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTratamientoDto {
  @IsString()
  @Length(1, 500)
  descripcion: string;

  @IsString()
  @Length(1, 100)
  dosis: string;

  @IsString()
  @Length(1, 100)
  frecuencia: string;

  @IsNumber()
  @IsNotEmpty()
  id_epa: number;
}
