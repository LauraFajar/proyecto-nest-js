import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoSeeder {
  constructor(
    @InjectRepository(Ingreso)
    private readonly ingresoRepository: Repository<Ingreso>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const data = [
      {
        fecha_ingreso: '2024-01-10',
        monto: 500.00,
        descripcion: 'Compra de fertilizantes',
        id_insumo: 1,
      },
      {
        fecha_ingreso: '2024-02-15',
        monto: 250.50,
        descripcion: 'Compra de semillas de cacao',
        id_insumo: 2,
      },
    ];

    for (const item of data) {
      const insumo = await this.insumoRepository.findOne({ where: { id_insumo: item.id_insumo } });
      if (insumo) {
        const exists = await this.ingresoRepository.findOne({ where: { fecha_ingreso: item.fecha_ingreso, id_insumo: { id_insumo: insumo.id_insumo } } });
        if (!exists) {
          const ingresoToCreate = {
            fecha_ingreso: item.fecha_ingreso,
            monto: item.monto,
            descripcion: item.descripcion,
            id_insumo: insumo,
          };
          await this.ingresoRepository.save(this.ingresoRepository.create(ingresoToCreate));
        }
      }
    }
  }
}