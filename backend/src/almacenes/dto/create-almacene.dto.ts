import { IsString, Length } from 'class-validator';

export class CreateAlmaceneDto {
  @IsString({ message: 'El nombre del almacén debe ser una cadena de texto.' })
  @Length(1, 30, {
    message: 'El nombre del almacén debe tener entre 1 y 30 caracteres.',
  })
  nombre_almacen: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @Length(1, 50, {
    message: 'La descripción debe tener entre 1 y 50 caracteres.',
  })
  descripcion: string;
}
