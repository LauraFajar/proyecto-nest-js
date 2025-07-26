import { IsString, Length } from 'class-validator';

export class CreateCultivoDto {
  @IsString()
  @Length(1, 20)
  tipo_cultivo: string;

}
