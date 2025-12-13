import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_unidad: number;

  @Column({
    name: 'unidad_medida',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  unidad_medida?: string;

  @Column({ default: 'completado' })
  estado: string;

  @ManyToOne(() => Insumo, (insumo) => insumo.salidas)
  @JoinColumn({ name: 'id_insumo' })
  insumo: Insumo;

  @Column({ name: 'id_cultivo', type: 'int', nullable: true })
  id_cultivo: number;

  @ManyToOne(() => Cultivo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_cultivo' })
  cultivo: Cultivo | null;
}
