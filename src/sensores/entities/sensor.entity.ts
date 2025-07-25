import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sublote } from '../../sublotes/entities/sublote.entity';

@Entity('sensores')
export class Sensor {
  @PrimaryGeneratedColumn({ name: 'id_sensor' })
  id_sensor: number;

  @Column()
  tipo_sensor: string;

  @ManyToOne(() => Sublote)
  @JoinColumn({ name: 'id_sublote' })
  id_sublote: Sublote;

  @Column()
  estado: string;
}
