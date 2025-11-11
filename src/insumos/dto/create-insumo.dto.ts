import { IsDateString, IsOptional, IsInt, IsString, Length } from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @Length(1, 30, { message: 'El nombre debe tener entre 1 y 30 caracteres.' })
  nombre_insumo: string;

  @IsString()
  @Length(1, 20, { message: 'El código debe tener entre 1 y 20 caracteres.' })
  codigo: string;

  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD.' })
  fecha_entrada: string;

  @IsString()
  @Length(1, 50, { message: 'La observación debe tener entre 1 y 50 caracteres.' })
  observacion: string;

  @IsOptional()
  @IsInt({ message: 'id_categoria debe ser un número entero.' })
  id_categoria?: number;

  @IsOptional()
  @IsInt({ message: 'id_almacen debe ser un número entero.' })
  id_almacen?: number;

}
