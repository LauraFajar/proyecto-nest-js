import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';

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

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categorias' })
  id_categorias: Categoria;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'id_almacenes' })
  id_almacenes: Almacen;

  @Column()
  observacion: string;

  @Column({ type: 'date' })
  fecha_salida: string;
}
