import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn({ name: 'id_lote' })
  id_lote: number;

  @Column()
  nombre_lote: string;

  @Column()
  descripcion: string;
}
