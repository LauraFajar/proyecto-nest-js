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
        nombre_epa: 'Picudo del plátano',
        descripcion:
          'daña el cultivo y puede transmitirse por las larvas que se alimentan de las raíces',
        tipo: 'plaga',
        estado: 'activo',
      },
      {
        nombre_epa: 'Moniliasis',
        descripcion:
          'causada por el hongo Moniliophthora roreri al cultivo de cacao',
        tipo: 'enfermedad',
        estado: 'activo',
      },
      {
        nombre_epa: 'Pulgones',
        descripcion: 'plaga que succiona la savia del cacao',
        tipo: 'plaga',
        estado: 'inactivo',
      },
      {
        nombre_epa: 'Maleza de hoja ancha',
        descripcion: 'Compiten con el cultivo por nutrientes, agua y luz solar.',
        tipo: 'arvense',
        estado: 'activo',
      },
    ];

    for (const item of data) {
      const exists = await this.epaRepository.findOne({
        where: { nombre_epa: item.nombre_epa },
      });
      if (!exists) {
        await this.epaRepository.save(this.epaRepository.create(item));
      }
    }
  }
}
