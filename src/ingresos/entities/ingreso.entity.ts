import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('ingresos')
export class Ingreso {
  @PrimaryGeneratedColumn({ name: 'id_ingreso' })
  id_ingreso: number;

  @Column({ type: 'date', name: 'fecha_ingreso' })
  fecha_ingreso: string;

  @Column({ type: 'numeric' })
  monto: number;

  @Column()
  descripcion: string;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo' })
  id_insumo: Insumo;
}
