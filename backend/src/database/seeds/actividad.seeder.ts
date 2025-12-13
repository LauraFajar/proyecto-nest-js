import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actividad } from 'src/actividades/entities/actividad.entity';
import { Cultivo } from 'src/cultivos/entities/cultivo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ActividadSeeder {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
  ) {}

  async seed() {
    const data = [
      {
        tipo_actividad: 'Riego',
        fecha: new Date('2024-03-11'),
        responsable: 'Juan Perez',
        detalles: 'Riego por goteo',
        estado: 'completada',
        id_cultivo: 1,
        costo_mano_obra: '120000',
        costo_maquinaria: '80000',
      },
      {
        tipo_actividad: 'Fertilización',
        fecha: new Date('2024-03-20'),
        responsable: 'Ana Gomez',
        detalles: 'Aplicación de NPK',
        estado: 'completada',
        id_cultivo: 1,
        costo_mano_obra: '90000',
        costo_maquinaria: '0',
      },
      {
        tipo_actividad: 'Cosecha',
        fecha: new Date('2024-07-10'),
        responsable: 'Luis Fernandez',
        detalles: 'Cosecha manual',
        estado: 'pendiente',
        id_cultivo: 2,
      },
    ];

    for (const item of data) {
      const cultivo = await this.cultivoRepository.findOne({
        where: { id_cultivo: item.id_cultivo },
      });
      if (cultivo) {
        const exists = await this.actividadRepository.findOne({
          where: {
            tipo_actividad: item.tipo_actividad,
            fecha: item.fecha,
            cultivo: { id_cultivo: cultivo.id_cultivo },
          },
        });
        if (!exists) {
          const { id_cultivo, ...rest } = item;
          await this.actividadRepository.save(
            this.actividadRepository.create({ ...rest, cultivo }),
          );
        }
      }
    }
  }
}
