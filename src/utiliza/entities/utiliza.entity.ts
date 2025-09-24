import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Entity('utiliza')
export class Utiliza {
  @PrimaryGeneratedColumn({ name: 'id_utiliza' })
  id_utiliza: number;

  @ManyToOne(() => Actividad)
  @JoinColumn({ name: 'id_actividades' })
  id_actividades: Actividad;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'id_insumos' })
  id_insumo: Insumo;
}
