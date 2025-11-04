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
          coordenadas: [[
            [-74.0058, 40.7130],
            [-74.0053, 40.7135],
            [-74.0048, 40.7130],
            [-74.0053, 40.7125],
            [-74.0058, 40.7130],
          ]],
        },
        {
          descripcion: 'Sublote para cafe de sombra',
          id_lote: lote2,
          ubicacion: 'Sur',
          coordenadas: [[
            [-74.0078, 40.7152],
            [-74.0073, 40.7157],
            [-74.0068, 40.7152],
            [-74.0073, 40.7147],
            [-74.0078, 40.7152],
          ]],
        },
      ];

      for (const item of data) {
        const exists = await this.subloteRepository.findOne({ where: { descripcion: item.descripcion } });
        if (!exists) {
          const subloteToCreate = this.subloteRepository.create({
            ...item,
            coordenadas: item.coordenadas ? { type: 'Polygon', coordinates: item.coordenadas } : undefined,
          });
          await this.subloteRepository.save(subloteToCreate);
        }
      }
    }
  }
}