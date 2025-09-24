import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('actividades')
export class Actividad {
  @PrimaryGeneratedColumn({ name: 'id_actividad' })
  id_actividad: number;

  @Column()
  tipo_actividad: string;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin: string;

  @Column()
  responsable: string;

  @Column({ type: 'text' })
  detalles: string;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costo_estimado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costo_real: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'json', nullable: true })
  fotografias: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Cultivo)
  @JoinColumn({ name: 'id_cultivo' })
  id_cultivo: Cultivo;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_asignado' })
  usuario_asignado: Usuario;
}
