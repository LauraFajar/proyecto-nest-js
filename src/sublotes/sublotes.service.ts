import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sublote } from './entities/sublote.entity';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';
import { Lote } from '../lotes/entities/lote.entity';

@Injectable()
export class SublotesService {
  constructor(
    @InjectRepository(Sublote)
    private sublotesRepository: Repository<Sublote>,
    @InjectRepository(Lote)
    private lotesRepository: Repository<Lote>,
  ) {}

  async create(createSubloteDto: CreateSubloteDto) {
    const lote = await this.lotesRepository.findOne({
      where: { id_lote: createSubloteDto.id_lote }
    });

    if (!lote) {
      throw new BadRequestException(`Lote con ID ${createSubloteDto.id_lote} no encontrado`);
    }

    const nuevoSublote = this.sublotesRepository.create({
      descripcion: createSubloteDto.descripcion,
      ubicacion: createSubloteDto.ubicacion,
      id_lote: lote
    });

    return await this.sublotesRepository.save(nuevoSublote);
  }

  async findAll() {
    return await this.sublotesRepository.find({
      relations: ['id_lote']
    });
  }

  async findOne(id_sublote: number) {
    return await this.sublotesRepository.findOne({
      where: { id_sublote },
      relations: ['id_lote']
    });
  }

  async update(id_sublote: number, updateSubloteDto: UpdateSubloteDto) {
    if (updateSubloteDto.id_lote) {
      const lote = await this.lotesRepository.findOne({
        where: { id_lote: updateSubloteDto.id_lote }
      });

      if (!lote) {
        throw new BadRequestException(`Lote con ID ${updateSubloteDto.id_lote} no encontrado`);
      }

      await this.sublotesRepository.update(id_sublote, {
        ...(updateSubloteDto.descripcion && { descripcion: updateSubloteDto.descripcion }),
        ...(updateSubloteDto.ubicacion && { ubicacion: updateSubloteDto.ubicacion }),
        id_lote: lote
      });
    } else {
      const updateData: any = { ...updateSubloteDto };
      delete updateData.id_lote;
      await this.sublotesRepository.update(id_sublote, updateData);
    }

    return this.findOne(id_sublote);
  }

  async getSensores(id_sublote: number) {
    const sublote = await this.sublotesRepository.findOne({
      where: { id_sublote },
      relations: ['sensores']
    });

    if (!sublote) {
      throw new BadRequestException(`Sublote con ID ${id_sublote} no encontrado`);
    }

    return sublote.sensores || [];
  }

  async getEstadisticas(id_sublote: number) {
    const sublote = await this.sublotesRepository.findOne({
      where: { id_sublote },
      relations: ['sensores', 'id_lote']
    });

    if (!sublote) {
      throw new BadRequestException(`Sublote con ID ${id_sublote} no encontrado`);
    }

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
    return await this.sublotesRepository.delete(id_sublote);
  }
}
