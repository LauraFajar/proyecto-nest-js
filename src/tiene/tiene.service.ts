import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tiene } from './entities/tiene.entity';
import { CreateTieneDto } from './dto/create-tiene.dto';
import { UpdateTieneDto } from './dto/update-tiene.dto';

@Injectable()
export class TieneService {
  constructor(
    @InjectRepository(Tiene)
    private tieneRepository: Repository<Tiene>,
  ) {}

  async create(createTieneDto: CreateTieneDto) {
    const nuevoRegistro = this.tieneRepository.create(createTieneDto);
    return await this.tieneRepository.save(nuevoRegistro);
  }

  async findAll() {
    return await this.tieneRepository.find();
  }

  async findOne(id_tiene: number) {
    return await this.tieneRepository.findOneBy({ id_tiene });
  }

  async update(id_tiene: number, updateTieneDto: UpdateTieneDto) {
    await this.tieneRepository.update(id_tiene, updateTieneDto);
    return this.findOne(id_tiene);
  }

  async remove(id_tiene: number) {
    return await this.tieneRepository.delete(id_tiene);
  }
}
