
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
    // Alinear la secuencia del ID con el máximo actual para evitar duplicados
    try {
      await this.tiporolRepository.query(
        `SELECT setval(pg_get_serial_sequence('tiporol','id_tipo_rol'), COALESCE((SELECT MAX(id_tipo_rol) FROM tiporol), 1), true)`
      );
    } catch (e) {
      // Si la BD no soporta la función o no existe la tabla aún, continuar sin bloquear.
    }

    const data = [
      { descripcion: 'Rol administrativo' },
      { descripcion: 'Rol para aprendices' },
      { descripcion: 'Rol para pasantes' },
      { descripcion: 'Rol invitado' },
    ];

    for (const item of data) {
      const exists = await this.tiporolRepository.findOne({ where: { descripcion: item.descripcion } });
      if (!exists) {
        try {
          await this.tiporolRepository.save(this.tiporolRepository.create(item));
        } catch (err: any) {
          // Evitar que un error de duplicado (por secuencia desalineada) detenga el proceso
          if (err?.code !== '23505') throw err;
        }
      }
    }
  }
}
