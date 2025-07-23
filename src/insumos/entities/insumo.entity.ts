import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('insumos')
export class Insumo {
  @PrimaryGeneratedColumn({ name: 'id_insumo' })
  id_insumo: number;

  @Column()
  nombre_insumo: string;

  @Column()
  codigo: string;

  @Column({ type: 'date' })
  fecha_entrada: string;

  @Column()
  observacion: string;

  @Column()
  id_categoria: number;

  @Column()
  id_almacen: number;

  @Column()
  id_salida: number;
}
