import { IsString, Length, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @Length(1, 30)
  @IsNotEmpty()
  nombre_rol: string;

  @IsInt()
  @Min(1, { message: 'El ID del tipo de rol debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID del tipo de rol es requerido' })
  id_tipo_rol: number;
}
