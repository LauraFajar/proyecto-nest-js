import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Lote } from '../../lotes/entities/lote.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('cultivos')
export class Cultivo {
  @PrimaryGeneratedColumn({ name: 'id_cultivo' })
  id_cultivo: number;

  @Column()
  tipo_cultivo: string;

  @Column({ type: 'date', nullable: true })
  fecha_siembra: string;

  @Column({ type: 'date', nullable: true })
  fecha_cosecha_estimada: string;

  @Column({ type: 'date', nullable: true })
  fecha_cosecha_real: string;

  @Column({ default: 'sembrado' })
  estado_cultivo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_cultivada: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'id_lote' })
  id_lote: Lote;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumo' })
  id_insumo: Insumo;
}
