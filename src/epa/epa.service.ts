import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epa } from './entities/epa.entity';
import { CreateEpaDto } from './dto/create-epa.dto';
import { UpdateEpaDto } from './dto/update-epa.dto';

@Injectable()
export class EpaService {
  constructor(
    @InjectRepository(Epa)
    private epaRepository: Repository<Epa>,
  ) {}

  async create(createEpaDto: CreateEpaDto) {
    const nuevoEpa = this.epaRepository.create(createEpaDto);
    return await this.epaRepository.save(nuevoEpa);
  }

  async findAll() {
    return await this.epaRepository.find();
  }

  async findOne(id_epa: number) {
    return await this.epaRepository.findOneBy({ id_epa });
  }

  async update(id_epa: number, updateEpaDto: UpdateEpaDto) {
    await this.epaRepository.update(id_epa, updateEpaDto);
    return this.findOne(id_epa);
  }

  async remove(id_epa: number) {
    return await this.epaRepository.delete(id_epa);
  }
}
