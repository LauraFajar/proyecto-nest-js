import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actividad } from 'src/actividades/entities/actividad.entity';
import { Cultivo } from 'src/cultivos/entities/cultivo.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ActividadSeeder {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seed() {
    try {
      const usuarios = await this.usuarioRepository.find();
      if (usuarios.length === 0) {
        console.log('No se encontraron usuarios, saltando el seeder de actividades.');
        return;
      }

      const data = [
      {
        tipo_actividad: 'Riego',
        fecha: new Date('2025-03-11'),
        detalles: 'Riego por goteo',
        estado: 'pendiente',
        id_cultivo: 1,
        costo_mano_obra: '120000',
        costo_maquinaria: '80000',
      },
      {
        tipo_actividad: 'Fertilización',
        fecha: new Date('2025-03-20'),
        detalles: 'Aplicación de NPK',
        estado: 'en_progreso',
        id_cultivo: 1,
        costo_mano_obra: '90000',
        costo_maquinaria: '0',
      },
      {
        tipo_actividad: 'Poda',
        fecha: new Date('2025-04-01'),
        detalles: 'Poda de mantenimiento',
        estado: 'cancelada',
        id_cultivo: 4,
        costo_mano_obra: '50000',
        costo_maquinaria: '0',
      },
      {
        tipo_actividad: 'Cosecha',
        fecha: new Date('2025-07-10'),
        detalles: 'Cosecha manual',
        estado: 'completada',
        id_cultivo: 2,
      },
    ];

    const juanCamilo = usuarios.find(u => u.nombres === 'Juan Camilo');
    const pasantePrueba = usuarios.find(u => u.nombres === 'Pasante Prueba');
    const invitadoPrueba = usuarios.find(u => u.nombres === 'Invitado Prueba');

    const userAssignments: { [key: string]: Usuario | undefined } = {
      'Riego': juanCamilo,
      'Fertilización': juanCamilo,
      'Cosecha': pasantePrueba,
      'Poda': invitadoPrueba,
    };

    let usuarioIndex = 0; 

    for (const item of data) {
      const { id_cultivo, ...rest } = item;
      const cultivo = await this.cultivoRepository.findOne({
        where: { id_cultivo },
      });
      
      if (!cultivo) {
        console.warn(`No se encontró el cultivo con ID ${id_cultivo} para la actividad ${item.tipo_actividad}`);
        continue;
      }

      const exists = await this.actividadRepository.findOne({
        where: {
          tipo_actividad: item.tipo_actividad,
          fecha: item.fecha,
          cultivo: { id_cultivo: cultivo.id_cultivo },
          detalles: item.detalles
        },
      });

      if (exists) {
        console.log(`Actividad ya existe: ${item.tipo_actividad} para cultivo ID ${cultivo.id_cultivo} el ${item.fecha.toISOString().split('T')[0]}`);
        continue;
      }

      let usuarioAsignado = userAssignments[item.tipo_actividad] || 
                          usuarios[usuarioIndex % usuarios.length];
      
      if (!userAssignments[item.tipo_actividad]) {
        usuarioIndex++;
      }

      if (!usuarioAsignado) {
        console.warn(`No se pudo asignar un usuario para la actividad: ${item.tipo_actividad}`);
        continue;
      }

      const actividadToCreate = this.actividadRepository.create({
        ...rest,
        cultivo,
        responsable: usuarioAsignado.nombres,
        responsableUsuario: usuarioAsignado,
      });

      try {
        await this.actividadRepository.save(actividadToCreate);
        console.log(`Creada actividad: ${item.tipo_actividad} para cultivo ID ${cultivo.id_cultivo} el ${item.fecha.toISOString().split('T')[0]}`);
      } catch (error) {
        console.error(`Error al crear actividad ${item.tipo_actividad}:`, error.message);
      }
    }
    } catch (error) {
      console.error('Error en ActividadSeeder:', error.message);
    }
  }
}
