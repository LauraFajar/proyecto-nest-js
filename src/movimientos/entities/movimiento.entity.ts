import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @Column()
  tipo_movimiento: string;

  @Column()
  id_insumo: number;

  @Column()
  cantidad: number;

  @Column()
  unidad_medida: string;

  @Column({ type: 'date' })
  fecha_movimiento: string;
}
