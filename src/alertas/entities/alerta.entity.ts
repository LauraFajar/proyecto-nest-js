import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sensor } from 'src/sensores/entities/sensor.entity';

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn({ name: 'id_alerta' })
  id_alerta: number;

  @Column()
  tipo_alerta: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  hora: string;

  @ManyToOne(() => Sensor)
  @JoinColumn({ name: 'id_sensor' })
  id_sensor: Sensor;
}
