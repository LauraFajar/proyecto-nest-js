import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tratamiento } from '../../tratamientos/entities/tratamiento.entity';

@Entity('epa')
export class Epa {
  @PrimaryGeneratedColumn({ name: 'id_epa' })
  id_epa: number;

  @Column()
  nombre_epa: string;

  @Column()
  descripcion: string;

  @Column({ nullable: true })
  imagen_referencia: string;

  @Column({
    type: 'enum',
    enum: ['enfermedad', 'plaga', 'arvense'],
    default: 'enfermedad',
  })
  tipo: string;

  @Column({ default: 'activo' })
  estado: string;

  @OneToMany(() => Tratamiento, (tratamiento) => tratamiento.id_epa)
  tratamientos: Tratamiento[];
}
