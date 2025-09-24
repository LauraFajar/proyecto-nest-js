import { IsString, Length } from 'class-validator';

export class CreateTiporolDto {
  @IsString()
  @Length(1, 50)
  descripcion: string;
}
