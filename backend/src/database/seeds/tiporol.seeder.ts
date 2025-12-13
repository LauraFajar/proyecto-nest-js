import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tiporol } from 'src/tiporol/entities/tiporol.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TipoRolSeeder {
  constructor(
    @InjectRepository(Tiporol)
    private readonly tiporolRepository: Repository<Tiporol>,
  ) {}

  async seed() {
    const data = [
      { descripcion: 'Rol administrativo' },
      { descripcion: 'Rol para aprendices' },
      { descripcion: 'Rol para pasantes' },
      { descripcion: 'Rol invitado' },
    ];

    for (const item of data) {
      const exists = await this.tiporolRepository.findOne({
        where: { descripcion: item.descripcion },
      });
      if (!exists) {
        await this.tiporolRepository.save(this.tiporolRepository.create(item));
      }
    }
  }
}
