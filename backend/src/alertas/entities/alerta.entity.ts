import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Sensor } from 'src/sensores/entities/sensor.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn({ name: 'id_alerta' })
  id_alerta: number;

  @Column()
  tipo_alerta: string;

  @Column()
  descripcion: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  hora: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Sensor, { nullable: true })
  @JoinColumn({ name: 'id_sensor' })
  sensor: Sensor;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
