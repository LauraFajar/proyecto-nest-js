import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Actividad } from './entities/actividad.entity';
import { CreateActividadeDto } from './dto/create-actividade.dto';
import { UpdateActividadeDto } from './dto/update-actividade.dto';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private actividadesRepository: Repository<Actividad>,
  ) {}

  async create(createActividadDto: CreateActividadeDto) {
    const cultivoExists = await this.actividadesRepository.manager
      .createQueryBuilder()
      .select('1')
      .from('cultivos', 'c')
      .where('c.id_cultivo = :id', { id: createActividadDto.id_cultivo })
      .getRawOne();
      
    if (!cultivoExists) {
      throw new NotFoundException(`Cultivo con ID ${createActividadDto.id_cultivo} no encontrado`);
    }

    const actividadData = {
      tipo_actividad: createActividadDto.tipo_actividad,
      fecha: createActividadDto.fecha,
      responsable: createActividadDto.responsable,
      detalles: createActividadDto.detalles,
      estado: createActividadDto.estado || 'pendiente',
      id_cultivo: createActividadDto.id_cultivo,
    };

    const actividad = this.actividadesRepository.create(actividadData);
    return await this.actividadesRepository.save(actividad);
  }

  async findAll(id_cultivo?: number) {
    const query = this.actividadesRepository.createQueryBuilder('actividad');
    
    if (id_cultivo) {
      query.where('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    return query.getMany();
  }

  async findOne(id_actividad: number) {
    const actividad = await this.actividadesRepository.findOne({
      where: { id_actividad },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
    }
    return actividad;
  }

  async update(id_actividad: number, updateActividadDto: UpdateActividadeDto) {
    const actividad = await this.findOne(id_actividad);
    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
    }

    const updateData: Partial<Actividad> = {};
    
    if (updateActividadDto.tipo_actividad) {
      updateData.tipo_actividad = updateActividadDto.tipo_actividad;
    }
    if (updateActividadDto.fecha) {
      updateData.fecha = new Date(updateActividadDto.fecha);
    }
    if (updateActividadDto.responsable) {
      updateData.responsable = updateActividadDto.responsable;
    }
    if (updateActividadDto.detalles) {
      updateData.detalles = updateActividadDto.detalles;
    }
    if (updateActividadDto.estado) {
      updateData.estado = updateActividadDto.estado;
    }
    if (updateActividadDto.id_cultivo) {
      updateData.id_cultivo = updateActividadDto.id_cultivo;
    }

    Object.assign(actividad, updateData);
    
    return await this.actividadesRepository.save(actividad);
  }

  async remove(id_actividad: number) {
    return await this.actividadesRepository.delete(id_actividad);
  }

  async obtenerReporteActividades(
    id_cultivo?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
    tipo_actividad?: string,
  ) {
    const query = this.actividadesRepository
      .createQueryBuilder('actividad')
      .orderBy('actividad.fecha', 'DESC');

    if (id_cultivo) {
      query.andWhere('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    if (fecha_inicio) {
      query.andWhere('actividad.fecha >= :fecha_inicio', { 
        fecha_inicio: new Date(fecha_inicio).toISOString() 
      });
    }

    if (fecha_fin) {
      query.andWhere('actividad.fecha <= :fecha_fin', { 
        fecha_fin: new Date(fecha_fin).toISOString() 
      });
    }

    if (tipo_actividad) {
      query.andWhere('actividad.tipo_actividad = :tipo_actividad', { tipo_actividad });
    }

    const actividades = await query.getMany();
    
    let cultivoInfo: { id_cultivo: number; tipo_cultivo: string } | null = null;
    if (id_cultivo) {
      const result = await this.actividadesRepository.manager
        .createQueryBuilder()
        .select(['id_cultivo', 'tipo_cultivo'])
        .from('cultivos', 'c')
        .where('c.id_cultivo = :id', { id: id_cultivo })
        .getRawOne();
      if (result) {
        cultivoInfo = {
          id_cultivo: result.id_cultivo,
          tipo_cultivo: result.tipo_cultivo
        };
      }
    }
    
    // Formatear la respuesta
    return actividades.map(actividad => ({
      id: actividad.id_actividad,
      tipo: actividad.tipo_actividad,
      fecha: actividad.fecha,
      estado: actividad.estado,
      responsable: actividad.responsable,
      cultivo: cultivoInfo ? {
        id: cultivoInfo.id_cultivo,
        tipo: cultivoInfo.tipo_cultivo
      } : null,
      detalles: actividad.detalles
    }));
  }

  async obtenerEstadisticas() {
    const actividades = await this.actividadesRepository.find();

    const estadisticas = {
      total: actividades.length,
      por_estado: {
        completadas: actividades.filter(a => a.estado === 'completada').length,
        pendientes: actividades.filter(a => a.estado === 'pendiente').length,
        en_progreso: actividades.filter(a => a.estado === 'en_progreso').length,
      },
      costo_promedio: 0,
      actividades_por_cultivo: this.agruparPorCultivo(actividades),
    };

    return estadisticas;
  }

  private agruparPorCultivo(actividades: Actividad[]) {
    return actividades.reduce((acc, actividad) => {
      const cultivoId = actividad.cultivo?.id_cultivo?.toString() || 'Sin cultivo';
      acc[cultivoId] = (acc[cultivoId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
