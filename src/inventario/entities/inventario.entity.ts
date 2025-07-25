import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'id_inventario' })
  id_inventario: number;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo' })
  id_insumo: Insumo;

  @Column({ type: 'numeric' })
  cantidad_stock: number;

  @Column()
  unidad_medida: string;

  @Column({ type: 'date' })
  fecha: string;

}
