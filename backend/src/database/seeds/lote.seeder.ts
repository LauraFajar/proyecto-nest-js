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
        nombre_lote: 'lote platano',
        descripcion: 'lote en donde se cosecha el cultivo de platano',
        activo: true,
        coordenadas: [
          [
            [-76.09094, 1.89297],
            [-76.09089, 1.89286],
            [-76.09103, 1.89275],
            [-76.09111, 1.89275],
            [-76.09114, 1.89283],
            [-76.09094, 1.89297],
          ],
        ],
      },
      {
        nombre_lote: 'lote de cacao',
        descripcion: 'lote donde se cosecha el cacao yamboro',
        activo: true,
        coordenadas: [
          [
            [-76.09072, 1.89311],
            [-76.09064, 1.89297],
            [-76.09081, 1.89289],
            [-76.09089, 1.89286],
            [-76.09094, 1.89297],
            [-76.09072, 1.89311],
          ],
        ],
      },
    ];

    for (const item of data) {
      const exists = await this.loteRepository.findOne({
        select: ['id_lote', 'nombre_lote'],
        where: { nombre_lote: item.nombre_lote },
      });
      if (!exists) {
        // Se transforma el array de coordenadas al formato que TypeORM espera
        const loteToCreate = this.loteRepository.create({
          ...item,
          coordenadas: item.coordenadas
            ? {
                type: 'Polygon',
                coordinates: item.coordenadas,
              }
            : undefined,
        });
        await this.loteRepository.save(loteToCreate);
      }
    }
  }
}
