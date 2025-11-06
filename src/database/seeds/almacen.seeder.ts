import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from '../../almacenes/entities/almacen.entity';

@Injectable()
export class AlmacenSeeder {
  constructor(
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
  ) {}

  async seed() {
    const exists = await this.almacenRepository.findOne({ where: { nombre_almacen: 'Principal' } });
    if (!exists) {
      await this.almacenRepository.save(
        this.almacenRepository.create({ nombre_almacen: 'Principal', descripcion: 'Almacén por defecto' }),
      );
    }
  }
}