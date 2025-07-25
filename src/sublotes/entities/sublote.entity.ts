import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lote } from '../../lotes/entities/lote.entity';

@Entity('sublotes')
export class Sublote {
  @PrimaryGeneratedColumn({ name: 'id_sublote' })
  id_sublote: number;

  @Column()
  descripcion: string;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'id_lote' })
  id_lote: Lote;

  @Column()
  ubicacion: string;

}
