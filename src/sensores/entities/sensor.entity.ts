import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

@Entity('sensores')
export class Sensor {
  @PrimaryGeneratedColumn({ name: 'id_sensor' })
  id_sensor: number;

  @Column()
  tipo_sensor: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_minimo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_maximo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_actual: number;

  @Column({ type: 'timestamp', nullable: true })
  ultima_lectura: Date;

  @Column({ default: 'activo' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  configuracion: string;

  @Column({ type: 'json', nullable: true })
  historial_lecturas: Array<{
    valor: number;
    timestamp: Date;
    unidad_medida?: string;
    observaciones?: string;
  }>;

  // MQTT Configuración
  @Column({ nullable: true })
  mqtt_host: string;

  @Column({ type: 'int', nullable: true })
  mqtt_port: number;

  @Column({ nullable: true })
  mqtt_topic: string;

  @Column({ nullable: true })
  mqtt_username: string;

  @Column({ nullable: true })
  mqtt_password: string;

  @Column({ default: false })
  mqtt_enabled: boolean;

  @Column({ nullable: true })
  mqtt_client_id: string;

  // HTTPS Configuración
  @Column({ nullable: true })
  https_url: string;

  @Column({ nullable: true })
  https_method: string;

  @Column({ nullable: true })
  https_headers: string; // JSON string

  @Column({ default: false })
  https_enabled: boolean;

  @Column({ nullable: true })
  https_auth_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Sublote)
  @JoinColumn({ name: 'id_sublote' })
  id_sublote: Sublote;

  @ManyToOne(() => Cultivo, { nullable: true })
  @JoinColumn({ name: 'cultivo_id' })
  cultivo: Cultivo | null;
}
