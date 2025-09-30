import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cultivo } from './entities/cultivo.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Injectable()
export class CultivosService {
  constructor(
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async create(createCultivoDto: CreateCultivoDto) {
    if (createCultivoDto.id_lote) {
      const loteExists = await this.loteRepository.exist({ where: { id_lote: createCultivoDto.id_lote } });
      if (!loteExists) {
        throw new NotFoundException(`Lote con ID ${createCultivoDto.id_lote} no encontrado`);
      }
    }

    if (createCultivoDto.id_insumo) {
      const insumoExists = await this.insumoRepository.exist({ where: { id_insumo: createCultivoDto.id_insumo } });
      if (!insumoExists) {
        throw new NotFoundException(`Insumo con ID ${createCultivoDto.id_insumo} no encontrado`);
      }
    }

    const cultivo = this.cultivoRepository.create({
      ...createCultivoDto,
      estado_cultivo: createCultivoDto.estado_cultivo || 'sembrado',
    });

    return await this.cultivoRepository.save(cultivo);
  }

  async findAll() {
    return this.cultivoRepository.find({
      order: { fecha_siembra: 'DESC' },
    });
  }

  async findOne(id: number) {
    const cultivo = await this.cultivoRepository.findOne({
      where: { id_cultivo: id },
    });
    if (!cultivo) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }
    return cultivo;
  }

  async update(id: number, updateCultivoDto: UpdateCultivoDto) {
    const cultivo = await this.cultivoRepository.findOneBy({ id_cultivo: id });
    
    if (!cultivo) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }

    if (updateCultivoDto.estado_cultivo !== undefined) {
      cultivo.estado_cultivo = updateCultivoDto.estado_cultivo;
    }
    
    if (updateCultivoDto.observaciones !== undefined) {
      cultivo.observaciones = updateCultivoDto.observaciones;
    }

    if (updateCultivoDto.id_lote !== undefined) {
      const lote = await this.loteRepository.findOneBy({ id_lote: updateCultivoDto.id_lote });
      if (!lote) {
        throw new NotFoundException(`Lote con ID ${updateCultivoDto.id_lote} no encontrado`);
      }
      cultivo.lote = lote;
    }

    if (updateCultivoDto.id_insumo !== undefined) {
      if (updateCultivoDto.id_insumo === null) {
        cultivo.insumo = null;
      } else {
        const insumo = await this.insumoRepository.findOneBy({ 
          id_insumo: updateCultivoDto.id_insumo 
        });
        if (!insumo) {
          throw new NotFoundException(`Insumo con ID ${updateCultivoDto.id_insumo} no encontrado`);
        }
        cultivo.insumo = insumo;
      }
    }

    if (updateCultivoDto.fecha_siembra !== undefined) {
      cultivo.fecha_siembra = new Date(updateCultivoDto.fecha_siembra);
    }
    if (updateCultivoDto.fecha_cosecha_estimada !== undefined) {
      cultivo.fecha_cosecha_estimada = updateCultivoDto.fecha_cosecha_estimada 
        ? new Date(updateCultivoDto.fecha_cosecha_estimada)
        : null;
    }
    if (updateCultivoDto.fecha_cosecha_real !== undefined) {
      cultivo.fecha_cosecha_real = updateCultivoDto.fecha_cosecha_real
        ? new Date(updateCultivoDto.fecha_cosecha_real)
        : null;
    }

    if (updateCultivoDto.tipo_cultivo !== undefined) {
      cultivo.tipo_cultivo = updateCultivoDto.tipo_cultivo;
    }

    await this.cultivoRepository.save(cultivo);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.cultivoRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }

    return { message: 'Cultivo eliminado correctamente' };
  }

  async getEstadisticas() {
    const total = await this.cultivoRepository.count();
    
    const porEstado = await this.cultivoRepository
      .createQueryBuilder('cultivo')
      .select('cultivo.estado_cultivo', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('cultivo.estado_cultivo')
      .getRawMany();

    const porTipo = await this.cultivoRepository
      .createQueryBuilder('cultivo')
      .select('cultivo.tipo_cultivo', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .groupBy('cultivo.tipo_cultivo')
      .getRawMany();

    return {
      total,
      por_estado: porEstado,
      por_tipo: porTipo,
    };
  }

  async getCalendario(fecha_desde?: string, fecha_hasta?: string) {
    const query = this.cultivoRepository.createQueryBuilder('cultivo')
      .leftJoinAndSelect('cultivo.lote', 'lote')
      .select([
        'cultivo.id_cultivo',
        'cultivo.tipo_cultivo',
        'cultivo.fecha_siembra',
        'cultivo.fecha_cosecha_estimada',
        'cultivo.fecha_cosecha_real',
        'cultivo.estado_cultivo',
        'lote.nombre_lote',
      ]);

    if (fecha_desde && fecha_hasta) {
      query.where('cultivo.fecha_siembra BETWEEN :fecha_desde AND :fecha_hasta', {
        fecha_desde,
        fecha_hasta,
      });
    } else if (fecha_desde) {
      query.where('cultivo.fecha_siembra >= :fecha_desde', { fecha_desde });
    } else if (fecha_hasta) {
      query.where('cultivo.fecha_siembra <= :fecha_hasta', { fecha_hasta });
    }

    return query.getMany();
  }
}
