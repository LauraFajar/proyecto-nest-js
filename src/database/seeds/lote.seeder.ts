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
        coordenadas: [[
          [-74.0060, 40.7128], // Punto 1 (Longitud, Latitud)
          [-74.0050, 40.7138], // Punto 2
          [-74.0040, 40.7128], // Punto 3
          [-74.0050, 40.7118], // Punto 4
          [-74.0060, 40.7128], // Punto 1 (Cerrando el polígono)
        ]],
      },
      {
        nombre_lote: 'Lote B2',
        descripcion: 'Lote para cultivo de cafe',
        activo: true,
        coordenadas: [[
          [-74.0080, 40.7150],
          [-74.0070, 40.7160],
          [-74.0060, 40.7150],
          [-74.0070, 40.7140],
          [-74.0080, 40.7150],
        ]],
      },
    ];

    for (const item of data) {
      const exists = await this.loteRepository.findOne({ where: { nombre_lote: item.nombre_lote } });
      if (!exists) {
        // Se transforma el array de coordenadas al formato que TypeORM espera
        const loteToCreate = this.loteRepository.create({
          ...item,
          coordenadas: item.coordenadas ? {
            type: 'Polygon',
            coordinates: item.coordenadas,
          } : undefined,
        });
        await this.loteRepository.save(loteToCreate);
      }
    }
  }
}