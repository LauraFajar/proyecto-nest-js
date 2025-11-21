import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sublote } from '../../sublotes/entities/sublote.entity';

@Entity('sensores')
export class Sensor {
  @PrimaryGeneratedColumn({ name: 'id_sensor' })
  id_sensor: number;

  @Column()
  tipo_sensor: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_minimo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_maximo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_actual: number;

  @Column({ type: 'timestamp', nullable: true })
  ultima_lectura: Date;

  @Column({ default: 'Activo' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  configuracion: string;

  @Column({ type: 'json', nullable: true })
  historial_lecturas: Array<{
    valor: number;
    timestamp: Date;
    unidad_medida?: string;
    observaciones?: string;
  }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Sublote)
  @JoinColumn({ name: 'id_sublote' })
  id_sublote: Sublote;
}
