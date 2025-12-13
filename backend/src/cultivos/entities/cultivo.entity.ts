import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Lote } from '../../lotes/entities/lote.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';

export enum TipoCultivo {
  TRANSITORIOS = 'transitorios',
  PERENNES = 'perennes',
  SEMIPERENNES = 'semiperennes',
}

@Entity('cultivos')
export class Cultivo {
  @PrimaryGeneratedColumn({ name: 'id_cultivo' })
  id_cultivo: number;

  @Column({ name: 'nombre_cultivo', length: 100, nullable: false })
  nombre_cultivo: string;

  @Column({
    name: 'tipo_cultivo',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  tipo_cultivo: string;

  @Column({ name: 'fecha_siembra', type: 'date', nullable: true })
  fecha_siembra: Date | null;

  @Column({ name: 'fecha_cosecha_estimada', type: 'date', nullable: true })
  fecha_cosecha_estimada: Date | null;

  @Column({ name: 'fecha_cosecha_real', type: 'date', nullable: true })
  fecha_cosecha_real: Date | null;

  @Column({
    name: 'estado_cultivo',
    type: 'varchar',
    nullable: false,
    default: 'sembrado',
  })
  estado_cultivo: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'id_lote', type: 'integer', nullable: true })
  id_lote: number | null;

  @Column({ name: 'id_insumo', type: 'integer', nullable: true })
  id_insumo: number | null;

  @ManyToOne(() => Lote, (lote) => lote.cultivos, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_lote' })
  lote: Lote | null;

  @ManyToOne(() => Insumo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_insumo' })
  insumo: Insumo | null;

  @OneToMany(() => Actividad, (actividad) => actividad.cultivo)
  actividades: Actividad[];
}
