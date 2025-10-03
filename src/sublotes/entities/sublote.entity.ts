import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Lote } from '../../lotes/entities/lote.entity';
import { Sensor } from '../../sensores/entities/sensor.entity';

@Entity('sublotes')
export class Sublote {
  @PrimaryGeneratedColumn({ name: 'id_sublote' })
  id_sublote: number;

  @Column()
  descripcion: string;

  @ManyToOne(() => Lote)
  @JoinColumn({ name: 'id_lote' })
  id_lote: Lote;

  @Column()
  ubicacion: string;

  @OneToMany(() => Sensor, sensor => sensor.id_sublote)
  sensores: Sensor[];
}
