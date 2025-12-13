import { PartialType } from '@nestjs/mapped-types';
import { CreateAlmaceneDto } from './create-almacene.dto';

export class UpdateAlmaceneDto extends PartialType(CreateAlmaceneDto) {}
