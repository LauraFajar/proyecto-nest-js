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
    const modulos = [
      'actividades',
      'almacenes',
      'categorias',
      'cultivos',
      'epa',
      'tratamientos',
      'ingresos',
      'insumos',
      'inventario',
      'lotes',
      'movimientos',
      'salidas',
      'sensores',
      'sublotes',
      'usuarios'
    ];

    const acciones = [
      { accion: 'create', nombre: 'Crear', descripcion: 'Permite crear nuevos registros' },
      { accion: 'read', nombre: 'Ver', descripcion: 'Permite ver los registros' },
      { accion: 'update', nombre: 'Editar', descripcion: 'Permite editar registros existentes' },
      { accion: 'delete', nombre: 'Eliminar', descripcion: 'Permite eliminar registros' },
      { accion: 'export', nombre: 'Exportar', descripcion: 'Permite exportar datos' }
    ];

    for (const modulo of modulos) {
      for (const accion of acciones) {
        const clave = `${modulo}:${accion.accion}`;
        const nombre_permiso = `${accion.nombre} ${modulo}`;
        
        let permiso = await this.permisoRepository.findOne({
          where: { clave },
        });

        if (!permiso) {
          permiso = await this.permisoRepository.save(
            this.permisoRepository.create({
              clave,
              recurso: modulo,
              accion: accion.accion,
              nombre_permiso,
              descripcion: accion.descripcion,
              activo: true,
            }),
          );
          console.log(`Permiso creado: ${clave}`);
        }
      }
    }

    // Asignar todos los permisos al usuario 'Admin Temporal'
    const adminTemporal = await this.usuarioRepository.findOne({
      where: { nombres: 'Admin Temporal' },
      relations: ['permisos'],
    });

    if (adminTemporal) {
      const todosLosPermisos = await this.permisoRepository.find();
      
      adminTemporal.permisos = [...todosLosPermisos];
      await this.usuarioRepository.save(adminTemporal);
      console.log('Todos los permisos asignados al usuario Admin Temporal');
    } else {
      console.warn('No se encontró el usuario "Admin Temporal". Asegúrese de que exista en la base de datos.');
    }
  }
}
