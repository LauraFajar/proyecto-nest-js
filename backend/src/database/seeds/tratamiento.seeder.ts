import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from '../../tratamientos/entities/tratamiento.entity';
import { Epa } from '../../epa/entities/epa.entity';

@Injectable()
export class TratamientoSeeder {
  constructor(
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepository: Repository<Tratamiento>,
    @InjectRepository(Epa)
    private readonly epaRepository: Repository<Epa>,
  ) {}

  async seed() {
    const epa1 = await this.epaRepository.findOne({ where: { id_epa: 1 } });
    const epa2 = await this.epaRepository.findOne({ where: { id_epa: 2 } });

    if (epa1 && epa2) {
      const data = [
        {
          descripcion: 'Control biologico con mariquitas',
          dosis: '100 ind/ha',
          frecuencia: 'Una vez por ciclo',
          id_epa: epa1,
          tipo: 'Biologico' as 'Biologico' | 'Quimico',
        },
        {
          descripcion: 'Aplicacion de fungicida quimico',
          dosis: '2 L/ha',
          frecuencia: 'Cada 15 días',
          id_epa: epa2,
          tipo: 'Quimico' as 'Biologico' | 'Quimico',
        },
        {
          descripcion: 'Control biológico con nematodos entomopatógenos',
          dosis: '5 millones/ha',
          frecuencia: 'Mensual',
          id_epa: epa1, 
          tipo: 'Biologico' as 'Biologico' | 'Quimico',
        },
        {
          descripcion: 'Aplicación de insecticida',
          dosis: '1 L/ha',
          frecuencia: 'Cada 30 días',
          id_epa: epa1,
          tipo: 'Quimico' as 'Biologico' | 'Quimico',
        },
      ];

      for (const item of data) {
        const exists = await this.tratamientoRepository
          .createQueryBuilder('tratamiento')
          .where('tratamiento.descripcion = :descripcion', {
            descripcion: item.descripcion,
          })
          .andWhere('tratamiento.id_epa = :epaId', {
            epaId: item.id_epa.id_epa,
          })
          .getOne();

        if (!exists) {
          const { id_epa, ...rest } = item;
          await this.tratamientoRepository.save(
            this.tratamientoRepository.create({ ...rest, id_epa: id_epa }),
          );
        } else {
        }
      }
    }
  }
}
