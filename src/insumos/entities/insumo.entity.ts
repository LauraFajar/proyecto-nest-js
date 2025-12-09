import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Salida } from 'src/salidas/entities/salida.entity';
import { Cultivo } from 'src/cultivos/entities/cultivo.entity';

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

  @ManyToMany(() => Cultivo, cultivo => cultivo.insumo)
  cultivos: Cultivo[];

  @Column({ type: 'boolean', name: 'es_herramienta', default: false })
  es_herramienta: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, name: 'costo_compra' })
  costo_compra?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, name: 'vida_util_horas' })
  vida_util_horas?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, name: 'depreciacion_por_hora' })
  depreciacion_por_hora?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, default: 0, name: 'depreciacion_acumulada' })
  depreciacion_acumulada?: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_compra' })
  fecha_compra?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'tipo_insumo', default: 'consumible' })
  tipo_insumo?: string;
}
