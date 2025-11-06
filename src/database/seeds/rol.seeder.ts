
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rol } from 'src/rol/entities/rol.entity';
import { Tiporol } from 'src/tiporol/entities/tiporol.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolSeeder {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Tiporol)
    private readonly tiporolRepository: Repository<Tiporol>,
  ) {}

  async seed() {
    // Alinear la secuencia del ID con el máximo actual para evitar duplicados
    try {
      await this.rolRepository.query(
        `SELECT setval(pg_get_serial_sequence('rol','id_rol'), COALESCE((SELECT MAX(id_rol) FROM rol), 1), true)`
      );
    } catch (e) {
      // Continuar si la tabla aún no existe o la BD no soporta la función.
    }

    const data = [
      { nombre_rol: 'Instructor', tipo_rol_desc: 'Rol administrativo' },
      { nombre_rol: 'Aprendiz', tipo_rol_desc: 'Rol para aprendices' },
      { nombre_rol: 'Pasante', tipo_rol_desc: 'Rol para pasantes' },
      { nombre_rol: 'Administrador', tipo_rol_desc: 'Rol administrativo' },
      { nombre_rol: 'Invitado', tipo_rol_desc: 'Rol invitado' },
    ];

    for (const item of data) {
      const exists = await this.rolRepository.findOne({ where: { nombre_rol: item.nombre_rol } });
      if (!exists) {
        const tipoRol = await this.tiporolRepository.findOne({ where: { descripcion: item.tipo_rol_desc } });
        if (tipoRol) {
          try {
            await this.rolRepository.save(this.rolRepository.create({ nombre_rol: item.nombre_rol, id_tipo_rol: tipoRol }));
          } catch (err: any) {
            if (err?.code !== '23505') throw err; // ignorar duplicados por desalineación de secuencia
          }
        }
      }
    }
  }
}
