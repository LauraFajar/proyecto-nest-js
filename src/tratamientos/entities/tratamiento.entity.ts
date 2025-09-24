import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Epa } from '../../epa/entities/epa.entity';

@Entity('tratamientos')
export class Tratamiento {
  @PrimaryGeneratedColumn({ name: 'id_tratamiento' })
  id_tratamiento: number;

  @Column()
  descripcion: string;

  @Column()
  dosis: number;

  @Column()
  frecuencia: string;

  @ManyToOne(() => Epa)
  @JoinColumn({ name: 'id_epa' })
  id_epa: Epa;
}
