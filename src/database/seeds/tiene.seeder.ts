import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tiene } from '../../tiene/entities/tiene.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Epa } from '../../epa/entities/epa.entity';

@Injectable()
export class TieneSeeder {
  constructor(
    @InjectRepository(Tiene)
    private readonly tieneRepository: Repository<Tiene>,
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Epa)
    private readonly epaRepository: Repository<Epa>,
  ) {}

  async seed() {
    const cultivo1 = await this.cultivoRepository.findOne({ where: { id_cultivo: 1 } });
    const epa1 = await this.epaRepository.findOne({ where: { id_epa: 1 } });

    const cultivo2 = await this.cultivoRepository.findOne({ where: { id_cultivo: 2 } });
    const epa2 = await this.epaRepository.findOne({ where: { id_epa: 2 } });

    if (cultivo1 && epa1) {
        const tiene1Exists = await this.tieneRepository.findOne({
            where: {
                cultivo: { id_cultivo: 1 },
                epa: { id_epa: 1 },
            },
        });

        if (!tiene1Exists) {
            await this.tieneRepository.save({
                cultivo: cultivo1,
                epa: epa1,
            });
        }
    }

    if (cultivo2 && epa2) {
        const tiene2Exists = await this.tieneRepository.findOne({
            where: {
                cultivo: { id_cultivo: 2 },
                epa: { id_epa: 2 },
            },
        });

        if (!tiene2Exists) {
            await this.tieneRepository.save({
                cultivo: cultivo2,
                epa: epa2,
            });
        }
    }
  }
}