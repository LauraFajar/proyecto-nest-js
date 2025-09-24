import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuarios' })
  id_usuarios: number;

  @Column()
  nombres: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  tipo_documento: string;

  @Column()
  numero_documento: string;

  @Column({ nullable: true })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expires?: Date;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'id_rol' })
  id_rol: Rol;
}