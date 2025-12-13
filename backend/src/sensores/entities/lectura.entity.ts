import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity('lecturas')
export class Lectura {
  @PrimaryGeneratedColumn({ name: 'id_lectura' })
  id_lectura: number;

  @ManyToOne(() => Sensor, { nullable: true })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor | null;

  // Permite persistir lecturas aún sin sensor registrado
  @Column({ name: 'mqtt_topic', type: 'varchar', length: 255, nullable: true })
  mqtt_topic?: string | null;

  @Column({ name: 'fecha', type: 'timestamp' })
  fecha: Date;

  @Column({ name: 'valor', type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 50, nullable: true })
  unidad_medida?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}