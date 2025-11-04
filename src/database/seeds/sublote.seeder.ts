import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Lote } from '../../lotes/entities/lote.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubloteSeeder {
  constructor(
    @InjectRepository(Sublote)
    private readonly subloteRepository: Repository<Sublote>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async seed() {
    const lote1 = await this.loteRepository.findOne({ where: { id_lote: 1 } });
    const lote2 = await this.loteRepository.findOne({ where: { id_lote: 2 } });

    if (lote1 && lote2) {
      const data = [
        {
          descripcion: 'Sublote para maiz temprano',
          id_lote: lote1,
          ubicacion: 'Norte',
        },
        {
          descripcion: 'Sublote para cafe de sombra',
          id_lote: lote2,
          ubicacion: 'Sur',
        },
      ];

      for (const item of data) {
        const exists = await this.subloteRepository.findOne({ where: { descripcion: item.descripcion } });
        if (!exists) {
          await this.subloteRepository.save(this.subloteRepository.create(item));
        }
      }
    }
  }
}