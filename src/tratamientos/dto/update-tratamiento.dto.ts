import { PartialType } from '@nestjs/mapped-types';
import { CreateTratamientoDto, TratamientoInsumoDto } from './create-tratamiento.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTratamientoDto extends PartialType(CreateTratamientoDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TratamientoInsumoDto)
  insumos?: TratamientoInsumoDto[];
}
