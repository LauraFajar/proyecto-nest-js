import { PartialType } from '@nestjs/mapped-types';
import { CreateTiporolDto } from './create-tiporol.dto';

export class UpdateTiporolDto extends PartialType(CreateTiporolDto) {}
