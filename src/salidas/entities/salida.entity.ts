import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('salidas')
export class Salida {
  @PrimaryGeneratedColumn({ name: 'id_salida' })
  id_salida: number;

  @Column()
  nombre: string;

  @Column()
  codigo: string;

  @Column()
  cantidad: number;

  @Column()
  id_categorias: number;

  @Column()
  id_almacenes: number;

  @Column()
  observacion: string;

  @Column({ type: 'date' })
  fecha_salida: string;
}
