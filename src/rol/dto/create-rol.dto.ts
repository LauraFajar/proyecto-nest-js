import { IsString, Length } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @Length(1, 30)
  nombre_rol: string;

}
