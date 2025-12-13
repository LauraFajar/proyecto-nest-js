import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class CreateEpaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del EPA es obligatorio' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  nombre_epa: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @Length(1, 500, {
    message: 'La descripción debe tener entre 1 y 500 caracteres',
  })
  descripcion: string;

  @IsOptional()
  @IsString()
  imagen_referencia?: string;

  @IsEnum(['enfermedad', 'plaga', 'arvense'], {
    message: 'El tipo debe ser enfermedad, plaga o arvense',
  })
  @IsNotEmpty({ message: 'El tipo de EPA es obligatorio' })
  tipo: 'enfermedad' | 'plaga' | 'arvense';

  @IsOptional()
  @IsEnum(['activo', 'inactivo'], {
    message: 'El estado debe ser activo o inactivo',
  })
  @IsString()
  estado?: string;
}
