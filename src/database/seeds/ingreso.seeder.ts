import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Injectable()
export class IngresoSeeder {
  constructor(
    @InjectRepository(Ingreso)
    private readonly ingresoRepository: Repository<Ingreso>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const insumo = await this.insumoRepository.findOne({ where: { codigo: 'FER-A' } });
    if (!insumo) return;

    const exists = await this.ingresoRepository.findOne({ where: { descripcion: 'Compra inicial fertilizante' } });
    if (!exists) {
      await this.ingresoRepository.save(
        this.ingresoRepository.create({
          fecha_ingreso: '2025-08-21',
          monto: 2500,
          descripcion: 'Compra inicial fertilizante',
          id_insumo: insumo,
        }),
      );
    }

    const exists2 = await this.ingresoRepository.findOne({ where: { descripcion: 'Reposición fertilizante' } });
    if (!exists2) {
      await this.ingresoRepository.save(
        this.ingresoRepository.create({
          fecha_ingreso: '2025-10-10',
          monto: 1800,
          descripcion: 'Reposición fertilizante',
          id_insumo: insumo,
        }),
      );
    }
  }
}