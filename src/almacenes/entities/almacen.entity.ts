import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('almacenes')
export class Almacen {
  @PrimaryGeneratedColumn({ name: 'id_almacen' })
  id_almacen: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;
}
