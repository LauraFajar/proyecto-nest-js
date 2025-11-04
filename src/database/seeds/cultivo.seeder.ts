import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cultivo, TipoCultivo } from 'src/cultivos/entities/cultivo.entity';
import { Lote } from 'src/lotes/entities/lote.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CultivoSeeder {
  constructor(
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async seed() {
    const data = [
      {
        nombre_cultivo: 'Plátano',
        tipo_cultivo: TipoCultivo.PERENNES,
        fecha_siembra: new Date('2024-03-15'),
        fecha_cosecha_estimada: new Date('2024-08-15'),
        estado_cultivo: 'sembrado',
        id_lote: 1,
      },
      {
        nombre_cultivo: 'Cacao',
        tipo_cultivo: TipoCultivo.PERENNES,
        fecha_siembra: new Date('2023-01-10'),
        fecha_cosecha_estimada: new Date('2025-01-10'),
        estado_cultivo: 'crecimiento',
        id_lote: 2,
      },
    ];

    for (const item of data) {
      const lote = await this.loteRepository.findOne({ where: { id_lote: item.id_lote } });
      if (lote) {
        const exists = await this.cultivoRepository.findOne({ where: { nombre_cultivo: item.nombre_cultivo, lote: { id_lote: lote.id_lote } } });
        if (!exists) {
          const { id_lote, ...rest } = item;
          const newCultivo = this.cultivoRepository.create({ ...rest, lote });
          await this.cultivoRepository.save(newCultivo);
        }
      }
    }
  }
}