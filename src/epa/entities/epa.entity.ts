import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('epa')
export class Epa {
  @PrimaryGeneratedColumn({ name: 'id_epa' })
  id_epa: number;

  @Column()
  nombre_epa: string;

  @Column()
  descripcion: string;

}
