import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Epa } from 'src/epa/entities/epa.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EpaSeeder {
  constructor(
    @InjectRepository(Epa)
    private readonly epaRepository: Repository<Epa>,
  ) {}

  async seed() {
    const data = [
      {
        nombre_epa: 'Roya',
        descripcion: 'Enfermedad fungica que afecta a las hojas del cafe.',
        tipo: 'enfermedad',
        estado: 'Activo',
      },
      {
        nombre_epa: 'Broca del Cafe',
        descripcion: 'Insecto que perfora los granos de cafe.',
        tipo: 'plaga',
        estado: 'Activo',
      },
      {
        nombre_epa: 'Gusano Cogollero',
        descripcion: 'Plaga que ataca el cogollo del maiz.',
        tipo: 'plaga',
        estado: 'Activo',
      },
    ];

    for (const item of data) {
      const exists = await this.epaRepository.findOne({ where: { nombre_epa: item.nombre_epa } });
      if (!exists) {
        await this.epaRepository.save(this.epaRepository.create(item));
      }
    }
  }
}