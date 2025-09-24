import { IsDateString, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CreateIngresoDto {
  @IsDateString({}, { message: 'La fecha debe estar en formato válido (YYYY-MM-DD).' })
  fecha_ingreso: string;

  @IsNumber({}, { message: 'El monto debe ser un número.' })
  monto: number;

  @IsString()
  @Length(1, 50, { message: 'La descripción debe tener entre 1 y 50 caracteres.' })
  descripcion: string;

}