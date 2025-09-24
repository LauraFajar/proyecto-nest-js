import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lote } from './entities/lote.entity';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';

@Injectable()
export class LotesService {
  constructor(
    @InjectRepository(Lote)
    private lotesRepository: Repository<Lote>,
  ) {}

  async create(createLoteDto: CreateLoteDto) {
    const nuevoLote = this.lotesRepository.create(createLoteDto);
    return await this.lotesRepository.save(nuevoLote);
  }

  async findAll() {
    return await this.lotesRepository.find();
  }

  async findOne(id_lote: number) {
    return await this.lotesRepository.findOneBy({ id_lote });
  }

  async update(id_lote: number, updateLoteDto: UpdateLoteDto) {
    await this.lotesRepository.update(id_lote, updateLoteDto);
    return this.findOne(id_lote);
  }

  async remove(id_lote: number) {
    return await this.lotesRepository.delete(id_lote);
  }
}
