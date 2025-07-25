import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lote } from '../../lotes/entities/lote.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('cultivos')
export class Cultivo {
  @PrimaryGeneratedColumn({ name: 'id_cultivo' })
  id_cultivo: number;

  @Column()
  tipo_cultivo: string;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'id_lote' })
  id_lote: Lote;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo' })
  id_insumo: Insumo;

}
