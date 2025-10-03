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
        descripcion: updateSubloteDto.descripcion,
        ubicacion: updateSubloteDto.ubicacion,
        id_lote: lote
      });
    } else {
      const { id_lote, ...updateData } = updateSubloteDto;
      await this.sublotesRepository.update(id_sublote, updateData);
    }

    return this.findOne(id_sublote);
  }

  async remove(id_sublote: number) {
    return await this.sublotesRepository.delete(id_sublote);
  }
}
