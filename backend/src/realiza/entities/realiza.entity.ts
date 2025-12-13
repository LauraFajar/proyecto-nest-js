import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';

@Entity('realiza')
export class Realiza {
  @PrimaryGeneratedColumn({ name: 'id_realiza' })
  id_realiza: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario' })
  usuario: Usuario;

  @ManyToOne(() => Actividad)
  @JoinColumn({ name: 'actividad' })
  actividad: Actividad;
}
