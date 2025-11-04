import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sublote } from './entities/sublote.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';

@Injectable()
export class SublotesService {
  constructor(
    @InjectRepository(Sublote)
    private readonly subloteRepository: Repository<Sublote>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async create(createSubloteDto: CreateSubloteDto): Promise<Sublote> {
    const { id_lote, coordenadas, ...subloteData } = createSubloteDto;

    const lote = await this.loteRepository.findOneBy({ id_lote });
    if (!lote) {
      throw new NotFoundException(`Lote con ID ${id_lote} no encontrado`);
    }

    const sublote = this.subloteRepository.create({
      ...subloteData,
      id_lote: lote,
      coordenadas: coordenadas ? {
        type: 'Polygon',
        coordinates: coordenadas,
      } : undefined,
    });

    return this.subloteRepository.save(sublote);
  }

  async findAll() {
    return this.subloteRepository.find({
      relations: ['id_lote']
    });
  }

  async findOne(id_sublote: number) {
    const sublote = await this.subloteRepository.findOne({
      where: { id_sublote },
      relations: ['id_lote']
    });
    if (!sublote) {
      throw new NotFoundException(`Sublote con ID ${id_sublote} no encontrado`);
    }
    return sublote;
  }

  async update(id_sublote: number, updateSubloteDto: UpdateSubloteDto): Promise<Sublote> {
    const sublote = await this.findOne(id_sublote);
    if (!sublote) {
      throw new NotFoundException(`Sublote con ID ${id_sublote} no encontrado`);
    }

    const { coordenadas, ...subloteData } = updateSubloteDto;

    Object.assign(sublote, subloteData);

    if (coordenadas) {
      sublote.coordenadas = { type: 'Polygon', coordinates: coordenadas };
    }

    if (updateSubloteDto.id_lote && sublote.id_lote.id_lote !== updateSubloteDto.id_lote) {
      const nuevoLote = await this.loteRepository.findOneBy({ id_lote: updateSubloteDto.id_lote });
      if (!nuevoLote) {
        throw new NotFoundException(`El nuevo Lote con ID ${updateSubloteDto.id_lote} no fue encontrado`);
      }
      sublote.id_lote = nuevoLote;
    }

    return this.subloteRepository.save(sublote);
  }

  async getSensores(id_sublote: number) {
    const sublote = await this.findOne(id_sublote);
    return sublote.sensores || [];
  }

  async getEstadisticas(id_sublote: number) {
    const sublote = await this.findOne(id_sublote);
    const sensores = sublote.sensores || [];
    const sensoresActivos = sensores.filter(s => s.estado === 'Activo').length;
    const sensoresInactivos = sensores.filter(s => s.estado === 'Inactivo').length;

    return {
      id_sublote: sublote.id_sublote,
      descripcion: sublote.descripcion,
      ubicacion: sublote.ubicacion,
      lote: sublote.id_lote,
      total_sensores: sensores.length,
      sensores_activos: sensoresActivos,
      sensores_inactivos: sensoresInactivos,
      tipos_sensores: [...new Set(sensores.map(s => s.tipo_sensor))],
      ultimo_registro: sensores.length > 0 ?
        Math.max(...sensores.map(s => s.created_at?.getTime() || 0)) : null
    };
  }

  async remove(id_sublote: number) {
    return this.subloteRepository.delete(id_sublote);
  }

  async findAllWithGeoData(): Promise<Sublote[]> {
    return this.subloteRepository.find({
      relations: ['id_lote'],
      select: ['id_sublote', 'descripcion', 'ubicacion', 'coordenadas', 'id_lote'],
    });
  }
}
