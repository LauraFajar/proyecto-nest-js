import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class PermisoSeeder {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seed() {
    const permisoData = {
      clave: 'finanzas:export',
      recurso: 'finanzas',
      accion: 'export',
      nombre_permiso: 'Exportar finanzas',
      descripcion: 'Permite exportar el resumen financiero en Excel y PDF',
      activo: true,
    };

    let permiso = await this.permisoRepository.findOne({
      where: { clave: permisoData.clave },
    });
    if (!permiso) {
      permiso = await this.permisoRepository.save(
        this.permisoRepository.create(permisoData),
      );
    }

    const admin = await this.usuarioRepository.findOne({
      where: { numero_documento: '999999' },
      relations: ['permisos'],
    });

    if (admin) {
      const yaAsignado = (admin.permisos || []).some(
        (p) => p.id_permiso === permiso.id_permiso,
      );
      if (!yaAsignado) {
        admin.permisos = [...(admin.permisos || []), permiso];
        await this.usuarioRepository.save(admin);
      }
    }
  }
}
