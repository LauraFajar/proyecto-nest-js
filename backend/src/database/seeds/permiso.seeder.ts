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
    const modulosBasicos = [
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

    const modulosConExportacion = [
      'finanzas',
      'reportes-inventario',
      'iot'
    ];

    const accionesBasicas = [
      { accion: 'create', nombre: 'Crear', descripcion: 'Permite crear nuevos registros' },
      { accion: 'read', nombre: 'Ver', descripcion: 'Permite ver los registros' },
      { accion: 'update', nombre: 'Editar', descripcion: 'Permite editar registros existentes' },
      { accion: 'delete', nombre: 'Eliminar', descripcion: 'Permite eliminar registros' }
    ];

    const accionExportacion = { 
      accion: 'export', 
      nombre: 'Exportar', 
      descripcion: 'Permite exportar datos' 
    };

    for (const modulo of [...modulosBasicos, ...modulosConExportacion]) {
      for (const accion of accionesBasicas) {
        await this.crearPermisoSiNoExiste(modulo, accion);
      }
    }

    for (const modulo of modulosConExportacion) {
      await this.crearPermisoSiNoExiste(modulo, accionExportacion);
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

  private async crearPermisoSiNoExiste(
    modulo: string, 
    accion: { accion: string; nombre: string; descripcion: string }
  ) {
    const clave = `${modulo}:${accion.accion}`;
    const nombre_permiso = `${accion.nombre} ${modulo}`;
    
    const permisoExistente = await this.permisoRepository.findOne({
      where: { clave },
    });

    if (!permisoExistente) {
      const permiso = this.permisoRepository.create({
        clave,
        recurso: modulo,
        accion: accion.accion,
        nombre_permiso,
        descripcion: accion.descripcion,
        activo: true,
      });
      
      await this.permisoRepository.save(permiso);
      console.log(`Permiso creado: ${clave}`);
    }
  }
}
