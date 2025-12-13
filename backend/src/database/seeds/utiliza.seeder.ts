import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utiliza } from '../../utiliza/entities/utiliza.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Injectable()
export class UtilizaSeeder {
  constructor(
    @InjectRepository(Utiliza)
    private readonly utilizaRepository: Repository<Utiliza>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const actividad1 = await this.actividadRepository.findOne({
      where: { id_actividad: 1 },
    });
    const insumo1 = await this.insumoRepository.findOne({
      where: { id_insumo: 1 },
    });

    const actividad2 = await this.actividadRepository.findOne({
      where: { id_actividad: 2 },
    });
    const insumo2 = await this.insumoRepository.findOne({
      where: { id_insumo: 2 },
    });

    if (actividad1 && insumo1) {
      const utiliza1Exists = await this.utilizaRepository
        .createQueryBuilder('utiliza')
        .where('utiliza.id_actividades = :actividadId', { actividadId: 1 })
        .andWhere('utiliza.id_insumo = :insumoId', { insumoId: 1 })
        .getOne();

      if (!utiliza1Exists) {
        await this.utilizaRepository.save({
          id_actividades: actividad1,
          id_insumo: insumo1,
        });
      }
    }

    if (actividad2 && insumo2) {
      const utiliza2Exists = await this.utilizaRepository
        .createQueryBuilder('utiliza')
        .where('utiliza.id_actividades = :actividadId', { actividadId: 2 })
        .andWhere('utiliza.id_insumo = :insumoId', { insumoId: 2 })
        .getOne();

      if (!utiliza2Exists) {
        await this.utilizaRepository.save({
          id_actividades: actividad2,
          id_insumo: insumo2,
        });
      }
    }
  }
}
