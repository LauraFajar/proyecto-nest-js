import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tratamiento } from './tratamiento.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('tratamiento_insumos')
export class TratamientoInsumo {
  @PrimaryGeneratedColumn({ name: 'id_tratamiento_insumo' })
  id_tratamiento_insumo: number;

  @Column({ name: 'id_tratamiento', type: 'int' })
  id_tratamiento: number;

  @Column({ name: 'id_insumo', type: 'int' })
  id_insumo: number;

  @Column({ name: 'cantidad_usada', type: 'decimal', precision: 10, scale: 2, nullable: false })
  cantidad_usada: number;

  @Column({ name: 'unidad_medida', length: 20, nullable: true })
  unidad_medida?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Tratamiento, tratamiento => tratamiento.tratamientoInsumos)
  @JoinColumn({ name: 'id_tratamiento' })
  id_tratamientos: Tratamiento;

  @ManyToOne(() => Insumo, insumo => insumo.tratamientoInsumos)
  @JoinColumn({ name: 'id_insumo' })
  id_insumos: Insumo;
}
