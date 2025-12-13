import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tiporol')
export class Tiporol {
  @PrimaryGeneratedColumn({ name: 'id_tipo_rol' })
  id_tipo_rol: number;

  @Column()
  descripcion: string;
}
