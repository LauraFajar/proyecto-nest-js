import { IsInt } from 'class-validator';

export class AsignarPermisoDto {
  @IsInt()
  id_usuario: number;

  @IsInt()
  id_permiso: number;
}
