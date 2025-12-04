import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn({ name: 'id_lote' })
  id_lote: number;

  @Column({ length: 30 })
  nombre_lote: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ default: true, nullable: false })
  activo: boolean;

  @OneToMany(() => Cultivo, cultivo => cultivo.lote)
  cultivos: Cultivo[];

  @OneToMany(() => Sublote, sublote => sublote.id_lote)
  sublotes: Sublote[];

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  coordenadas: any;
}
