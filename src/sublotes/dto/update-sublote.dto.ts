import { PartialType } from '@nestjs/mapped-types';
import { CreateSubloteDto } from './create-sublote.dto';
import { IsString, Length, IsNumber, IsOptional } from 'class-validator';

export class UpdateSubloteDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  ubicacion?: string;

  @IsOptional()
  @IsNumber()
  id_lote?: number;
}
