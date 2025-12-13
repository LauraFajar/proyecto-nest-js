import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AlmacenSeeder {
  constructor(
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
  ) {}

  async seed() {
    const data = [
      {
        nombre_almacen: 'Almacen Principal',
        descripcion: 'Almacen para insumos generales',
      },
      {
        nombre_almacen: 'Almacen de Cosecha',
        descripcion: 'Almacen para productos cosechados',
      },
    ];

    for (const item of data) {
      const exists = await this.almacenRepository.findOne({
        where: { nombre_almacen: item.nombre_almacen },
      });
      if (!exists) {
        await this.almacenRepository.save(this.almacenRepository.create(item));
      }
    }
  }
}
