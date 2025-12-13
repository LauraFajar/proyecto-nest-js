import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

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

  @Column({ name: 'id_cultivo', type: 'int', nullable: true })
  id_cultivo: number | null;

  @ManyToOne(() => Cultivo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_cultivo' })
  cultivo: Cultivo | null;
}
