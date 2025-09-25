import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn({ name: 'id_lote' })
  id_lote: number;

  @Column({ length: 100 })
  nombre_lote: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Cultivo, cultivo => cultivo.lote)
  cultivos: Cultivo[];
}
