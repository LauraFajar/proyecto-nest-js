import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermisoDto {
  @IsString()
  @MaxLength(100)
  clave: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  recurso?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  accion?: string;

  @IsString()
  @MaxLength(150)
  nombre_permiso: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
