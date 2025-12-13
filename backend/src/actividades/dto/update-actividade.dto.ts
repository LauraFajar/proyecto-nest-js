import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadeDto } from './create-actividade.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateActividadeDto extends PartialType(CreateActividadeDto) {
  @IsNumber()
  @IsOptional()
  id_cultivo?: number;

  @IsNumber()
  @IsOptional()
  responsable_id?: number;
}
