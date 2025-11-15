import { IsIn, IsInt, IsDateString, IsString, IsNumber, Length } from 'class-validator';

export class CreateMovimientoDto {
  @IsIn(['Entrada', 'Salida'], { message: 'El tipo de movimiento debe ser "Entrada" o "Salida".' })
  tipo_movimiento: string;

  @IsNumber()
  id_insumo: number;

  @IsInt({ message: 'Cantidad debe ser un número entero.' })
  cantidad: number;

  @IsString()
  @Length(1, 20, { message: 'Unidad de medida debe tener entre 1 y 20 caracteres.' })
  unidad_medida: string;

  @IsDateString({}, { message: 'Fecha de movimiento debe estar en formato YYYY-MM-DD.' })
  fecha_movimiento: string;
}
