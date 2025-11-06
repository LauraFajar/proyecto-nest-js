import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('inventarios')
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'id_inventario' })
  id_inventario: number;

  @Column()
  cantidad_stock: number;

  @Column()
  unidad_medida: string;

  @Column({ type: 'date', nullable: true })
  fecha: string
  
  // Relación correcta: muchos registros de inventario pueden referenciar un mismo insumo
  @ManyToOne(() => Insumo, { eager: true })
  @JoinColumn({ name: 'id_insumo' })
  insumo: Insumo;
}
