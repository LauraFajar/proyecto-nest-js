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
    const lote1 = await this.loteRepository.findOne({
      select: ['id_lote', 'nombre_lote', 'descripcion', 'activo'],
      where: { id_lote: 1 },
    });
    const lote2 = await this.loteRepository.findOne({
      select: ['id_lote', 'nombre_lote', 'descripcion', 'activo'],
      where: { id_lote: 2 },
    });

    if (lote1 && lote2) {
      const data = [
        {
          descripcion: 'Sublote para plátano',
          id_lote: lote1,
          ubicacion: 'Noroeste',
          coordenadas: [
            [
              [-76.09111, 1.89286],
              [-76.09103, 1.89292],
              [-76.09097, 1.89281],
              [-76.09106, 1.89278],
              [-76.09108, 1.89278],
              [-76.09111, 1.89286],
            ],
          ],
        },
        {
          descripcion: 'Sublote para cacao trinitario',
          id_lote: lote2,
          ubicacion: 'Sur',
          coordenadas: [
            [
              [-76.09078, 1.89308],
              [-76.09075, 1.89308],
              [-76.09067, 1.89294],
              [-76.09069, 1.89294],
              [-76.09078, 1.89308],
            ],
          ],
        },
      ];

      for (const item of data) {
        const exists = await this.subloteRepository.findOne({
          select: ['id_sublote', 'descripcion', 'ubicacion'],
          where: { descripcion: item.descripcion },
        });
        if (!exists) {
          const { coordenadas, ...rest } = item as any;
          const subloteToCreate = this.subloteRepository.create({
            ...rest,
          });
          await this.subloteRepository.save(subloteToCreate);
        }
      }
    }
  }
}
