import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Epa } from '../../epa/entities/epa.entity';

@Entity('tiene')
export class Tiene {
  @PrimaryGeneratedColumn({ name: 'id_tiene' })
  id_tiene: number;

  @ManyToOne(() => Cultivo)
  @JoinColumn({ name: 'cultivo' })
  cultivo: Cultivo;

  @ManyToOne(() => Epa)
  @JoinColumn({ name: 'epa' })
  epa: Epa;
}
