import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lote } from 'src/lotes/entities/lote.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LoteSeeder {
  constructor(
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async seed() {
    const data = [
      {
        nombre_lote: 'Lote A1',
        descripcion: 'Lote para cultivo de maiz',
        activo: true,
      },
      {
        nombre_lote: 'Lote B2',
        descripcion: 'Lote para cultivo de cafe',
        activo: true,
      },
    ];

    for (const item of data) {
      const exists = await this.loteRepository.findOne({ where: { nombre_lote: item.nombre_lote } });
      if (!exists) {
        await this.loteRepository.save(this.loteRepository.create(item));
      }
    }
  }
}