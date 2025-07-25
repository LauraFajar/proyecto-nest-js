import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tiporol } from 'src/tiporol/entities/tiporol.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column()
  nombre_rol: string;

  @ManyToOne(() => Tiporol)
  @JoinColumn({ name: 'id_tipo_rol' })
  id_tipo_rol: Tiporol;
}
