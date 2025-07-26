import { IsString, Length, IsOptional } from 'class-validator';

export class CreateEpaDto {
  @IsString()
  @Length(1, 30)
  nombre_epa: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  descripcion?: string;
}
