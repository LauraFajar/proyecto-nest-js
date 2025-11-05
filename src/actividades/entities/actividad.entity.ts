import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { FotoActividad } from './foto-actividad.entity';

@Entity('actividades')
export class Actividad {
  @PrimaryGeneratedColumn({ name: 'id_actividad' })
  id_actividad: number;

  @Column({ name: 'tipo_actividad', length: 20, nullable: false })
  tipo_actividad: string;

  @Column({ name: 'fecha', type: 'date', nullable: false })
  fecha: Date;

  @Column({ name: 'responsable', length: 50, nullable: false })
  responsable: string;

  @Column({ name: 'detalles', length: 50, nullable: false })
  detalles: string;

  @Column({ 
    name: 'estado', 
    type: 'varchar', 
    length: 20, 
    nullable: true, 
    default: 'pendiente'
  })
  estado: string;

  @Column({ name: 'id_cultivo', nullable: true })
  id_cultivo: number;

  @ManyToOne(() => Cultivo, cultivo => cultivo.actividades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cultivo' })
  cultivo: Cultivo;

  @OneToMany(() => FotoActividad, (foto) => foto.actividad)
  fotos: FotoActividad[];
}
