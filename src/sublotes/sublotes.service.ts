import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sublote } from './entities/sublote.entity';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';

@Injectable()
export class SublotesService {
  constructor(
    @InjectRepository(Sublote)
    private sublotesRepository: Repository<Sublote>,
  ) {}

  async create(createSubloteDto: CreateSubloteDto) {
    const nuevoSublote = this.sublotesRepository.create(createSubloteDto);
    return await this.sublotesRepository.save(nuevoSublote);
  }

  async findAll() {
    return await this.sublotesRepository.find();
  }

  async findOne(id_sublote: number) {
    return await this.sublotesRepository.findOneBy({ id_sublote });
  }

  async update(id_sublote: number, updateSubloteDto: UpdateSubloteDto) {
    await this.sublotesRepository.update(id_sublote, updateSubloteDto);
    return this.findOne(id_sublote);
  }

  async remove(id_sublote: number) {
    return await this.sublotesRepository.delete(id_sublote);
  }
}
