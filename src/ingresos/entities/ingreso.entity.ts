import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ingresos')
export class Ingreso {
  @PrimaryGeneratedColumn({ name: 'id_ingreso' })
  id_ingreso: number;

  @Column({ type: 'date', name: 'fecha_ingreso' })
  fecha_ingreso: string;

  @Column({ type: 'numeric' })
  monto: number;

  @Column()
  descripcion: string;

  @Column()
  id_insumo: number;
}
