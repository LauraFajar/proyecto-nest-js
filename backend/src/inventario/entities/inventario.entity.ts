import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'id_inventario' })
  id_inventario: number;

  @Column()
  cantidad_stock: number;

  @Column()
  unidad_medida: string;

  @Column({ type: 'date', nullable: true })
  fecha: string;
  @Column({ name: 'id_insumo', nullable: true })
  id_insumo: number;

  @OneToOne(() => Insumo, { eager: true })
  @JoinColumn({ name: 'id_insumo' })
  insumo: Insumo;
}
