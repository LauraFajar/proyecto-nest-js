import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Salida } from 'src/salidas/entities/salida.entity';

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

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categoria' })
  id_categoria: Categoria;

  @ManyToOne(() => Almacen)
  @JoinColumn({ name: 'id_almacen' })
  id_almacen: Almacen;

  @OneToMany(() => Salida, (salida) => salida.insumo)
  salidas: Salida[];
}