import { IsString, Length, IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTratamientoDto {
  @IsString()
  @Length(1, 500)
  descripcion: string;

  @IsString()
  @Length(1, 100)
  dosis: string;

  @IsString()
  @Length(1, 100)
  frecuencia: string;

  @IsOptional()
  @IsEnum(['Biologico', 'Quimico'], { message: 'El tipo debe ser Biologico o Quimico' })
  tipo?: 'Biologico' | 'Quimico';

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_epa: number;
}
