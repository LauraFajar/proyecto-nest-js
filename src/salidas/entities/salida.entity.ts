import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('salidas')
export class Salida {
  @PrimaryGeneratedColumn({ name: 'id_salida' })
  id_salida: number;

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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_unidad: number;

  @Column({ default: 'completado' })
  estado: string;

  @ManyToOne(() => Insumo, (insumo) => insumo.salidas)
  @JoinColumn({ name: 'id_insumo' })
  insumo: Insumo;
}