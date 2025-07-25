import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

@Entity('actividades')
export class Actividad {
  @PrimaryGeneratedColumn({ name: 'id_actividad' })
  id_actividad: number;

  @Column()
  tipo_actividad: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column()
  responsable: string;

  @Column()
  detalles: string;

  @ManyToOne(() => Cultivo)
  @JoinColumn({ name: 'id_cultivo' })
  id_cultivo: Cultivo;
}
