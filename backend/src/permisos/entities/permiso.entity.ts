import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn({ name: 'id_permiso' })
  id_permiso: number;

  @Column({ length: 64, unique: true })
  clave: string; 

  @Column({ length: 128, name: 'recurso' })
  recurso: string;

  @Column({ length: 128, name: 'accion' })
  accion: string;

  @Column({ length: 128 })
  nombre_permiso: string; 

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToMany(() => Usuario, (usuario) => usuario.permisos)
  usuarios: Usuario[];
}