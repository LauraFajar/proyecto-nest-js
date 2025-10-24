import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Epa } from '../../epa/entities/epa.entity';

@Entity('tratamientos')
export class Tratamiento {
  @PrimaryGeneratedColumn({ name: 'id_tratamiento' })
  id_tratamiento: number;

  @Column('text')
  descripcion: string;

  @Column()
  dosis: string;

  @Column()
  frecuencia: string;

  @Column({ type: 'enum', enum: ['Biologico', 'Quimico'], enumName: 'tratamientos_tipo_enum', default: 'Biologico' })
  tipo: 'Biologico' | 'Quimico';

  @ManyToOne(() => Epa)
  @JoinColumn({ name: 'id_epa' })
  id_epa: Epa;
}
