import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Actividad } from './actividad.entity';

@Entity('fotos_actividades')
export class FotoActividad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  url_imagen: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_carga' })
  fecha_carga: Date;

  @ManyToOne(() => Actividad, (actividad) => actividad.fotos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_actividad' })
  actividad: Actividad;
}