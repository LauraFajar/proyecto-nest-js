import { IsString, Length } from 'class-validator';

export class CreateSubloteDto {
  @IsString()
  @Length(1, 50)
  descripcion: string;

  @IsString()
  @Length(1, 50)
  ubicacion: string;

}
