import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilizaDto } from './create-utiliza.dto';

export class UpdateUtilizaDto extends PartialType(CreateUtilizaDto) {}
