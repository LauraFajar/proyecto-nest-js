import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Realiza } from 'src/realiza/entities/realiza.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Actividad } from 'src/actividades/entities/actividad.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RealizaSeeder {
  constructor(
    @InjectRepository(Realiza)
    private readonly realizaRepository: Repository<Realiza>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
  ) {}

  async seed() {
    const data = [
      {
        id_usuario: 1,
        id_actividad: 1,
      },
      {
        id_usuario: 2,
        id_actividad: 2,
      },
    ];

    for (const item of data) {
      const usuario = await this.usuarioRepository.findOne({ where: { id_usuarios: item.id_usuario } });
      const actividad = await this.actividadRepository.findOne({ where: { id_actividad: item.id_actividad } });
      if (usuario && actividad) {
        const exists = await this.realizaRepository.findOne({ where: { usuario: { id_usuarios: usuario.id_usuarios }, actividad: { id_actividad: actividad.id_actividad } } });
        if (!exists) {
          await this.realizaRepository.save(this.realizaRepository.create({ usuario, actividad }));
        }
      }
    }
  }
}