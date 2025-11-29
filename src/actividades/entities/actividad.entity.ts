import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { FotoActividad } from './foto-actividad.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

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

  @Column({ name: 'responsable_id', type: 'int', nullable: true })
  responsable_id?: number;

  @Column({ name: 'detalles', length: 50, nullable: false })
  detalles: string;

  @Column({
    name: 'costo_mano_obra',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0
  })
  costo_mano_obra: string;

  @Column({
    name: 'horas_trabajadas',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true
  })
  horas_trabajadas: string;

  @Column({
    name: 'tarifa_hora',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true
  })
  tarifa_hora: string;

  @Column({
    name: 'costo_maquinaria',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0
  })
  costo_maquinaria: string;

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

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'responsable_id' })
  responsableUsuario?: Usuario;

  @OneToMany(() => FotoActividad, (foto) => foto.actividad)
  fotos: FotoActividad[];
}
