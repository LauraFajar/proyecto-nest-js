import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoSeeder {
  constructor(
    @InjectRepository(Ingreso)
    private readonly ingresoRepository: Repository<Ingreso>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
  ) {}

  async seed() {
    const cultivoPlatano = await this.cultivoRepository.findOne({
      where: { id_cultivo: 1 },
    });
    const data = [
      {
        fecha_ingreso: '2025-03-10',
        monto: 1500000.0,
        descripcion: 'Venta de racimos de plátano',
        id_insumo: 1,
        id_cultivo: cultivoPlatano?.id_cultivo,
      },
      {
        fecha_ingreso: '2025-04-05',
        monto: 900000.0,
        descripcion: 'Venta local plátano',
        id_insumo: 1,
        id_cultivo: cultivoPlatano?.id_cultivo,
      },
    ];

    for (const item of data) {
      const insumo = await this.insumoRepository.findOne({
        where: { id_insumo: item.id_insumo },
      });
      const cultivo = item.id_cultivo
        ? await this.cultivoRepository.findOne({
            where: { id_cultivo: item.id_cultivo },
          })
        : null;
      if (insumo) {
        const exists = await this.ingresoRepository
          .createQueryBuilder('i')
          .where('i.fecha_ingreso = :fecha', { fecha: item.fecha_ingreso })
          .andWhere('i.id_insumo = :insumoId', { insumoId: insumo.id_insumo })
          .getOne();
        if (!exists) {
          const ingresoToCreate = {
            fecha_ingreso: item.fecha_ingreso,
            monto: item.monto,
            descripcion: item.descripcion,
            id_insumo: insumo,
            cultivo: cultivo || null,
            id_cultivo: cultivo?.id_cultivo ?? null,
          } as Partial<Ingreso>;
          await this.ingresoRepository.save(
            this.ingresoRepository.create(ingresoToCreate),
          );
        }
      }
    }
  }
}
