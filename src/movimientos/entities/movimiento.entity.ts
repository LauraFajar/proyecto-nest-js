import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @Column()
  tipo_movimiento: string;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo' })
  id_insumo: Insumo;

  @Column()
  cantidad: number;

  @Column()
  unidad_medida: string;

  @Column({ type: 'date' })
  fecha_movimiento: string;
}
