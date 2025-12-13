import { PartialType } from '@nestjs/mapped-types';
import { CreateTratamientoDto } from './create-tratamiento.dto';
import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTratamientoDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  dosis?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  frecuencia?: string;

  @IsOptional()
  @IsEnum(['Biologico', 'Quimico'], {
    message: 'El tipo debe ser Biologico o Quimico',
  })
  tipo?: 'Biologico' | 'Quimico';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_epa?: number;

  @IsOptional()
  @IsArray()
  insumos?: any[];
}
