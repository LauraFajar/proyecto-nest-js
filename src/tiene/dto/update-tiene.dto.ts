import { PartialType } from '@nestjs/mapped-types';
import { CreateTieneDto } from './create-tiene.dto';

export class UpdateTieneDto extends PartialType(CreateTieneDto) {}
