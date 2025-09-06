import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './entities/actividad.entity';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private actividadesRepository: Repository<Actividad>,
  ) {}

  async create(createActividadDto: any) {
    const nuevaActividad = this.actividadesRepository.create(createActividadDto);
    return await this.actividadesRepository.save(nuevaActividad);
  }

  async findAll() {
    return await this.actividadesRepository.find({
      relations: ['id_cultivo'],
    });
  }

  async findOne(id_actividad: number) {
    const actividad = await this.actividadesRepository.findOne({
      where: { id_actividad },
      relations: ['id_cultivo'],
    });
    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
    }
    return actividad;
  }

  async update(id_actividad: number, updateActividadDto: any) {
    await this.actividadesRepository.update(id_actividad, updateActividadDto);
    return this.findOne(id_actividad);
  }

  async remove(id_actividad: number) {
    return await this.actividadesRepository.delete(id_actividad);
  }

  // Métodos de reportes integrados
  async obtenerReporteActividades(
    id_cultivo?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
  ) {
    const query = this.actividadesRepository.createQueryBuilder('actividad')
      .leftJoinAndSelect('actividad.id_cultivo', 'cultivo');

    if (id_cultivo) {
      query.where('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    if (fecha_inicio && fecha_fin) {
      query.andWhere('actividad.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin', {
        fecha_inicio,
        fecha_fin,
      });
    }

    const actividades = await query.getMany();

    return {
      total_actividades: actividades.length,
      actividades_completadas: actividades.filter(a => a.estado === 'completada').length,
      actividades_pendientes: actividades.filter(a => a.estado === 'pendiente').length,
      actividades_en_progreso: actividades.filter(a => a.estado === 'en_progreso').length,
      costo_total: actividades.reduce((sum, a) => sum + (a.costo_estimado || 0), 0),
      actividades,
    };
  }

  async obtenerEstadisticas() {
    const actividades = await this.actividadesRepository.find({
      relations: ['id_cultivo'],
    });

    const estadisticas = {
      total: actividades.length,
      por_estado: {
        completadas: actividades.filter(a => a.estado === 'completada').length,
        pendientes: actividades.filter(a => a.estado === 'pendiente').length,
        en_progreso: actividades.filter(a => a.estado === 'en_progreso').length,
      },
      costo_promedio: actividades.length > 0 ? 
        actividades.reduce((sum, a) => sum + (a.costo_estimado || 0), 0) / actividades.length : 0,
      actividades_por_cultivo: this.agruparPorCultivo(actividades),
    };

    return estadisticas;
  }

  private agruparPorCultivo(actividades: Actividad[]) {
    return actividades.reduce((acc, actividad) => {
      const cultivoId = actividad.id_cultivo?.toString() || 'Sin cultivo';
      acc[cultivoId] = (acc[cultivoId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
