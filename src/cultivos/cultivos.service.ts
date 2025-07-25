import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cultivo } from './entities/cultivo.entity';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Injectable()
export class CultivosService {
  constructor(
    @InjectRepository(Cultivo)
    private cultivosRepository: Repository<Cultivo>,
  ) {}

  async create(createCultivoDto: CreateCultivoDto) {
    const nuevoCultivo = this.cultivosRepository.create(createCultivoDto);
    return await this.cultivosRepository.save(nuevoCultivo);
  }

  async findAll() {
    return await this.cultivosRepository.find();
  }

  async findOne(id_cultivo: number) {
    return await this.cultivosRepository.findOneBy({ id_cultivo });
  }

  async update(id_cultivo: number, updateCultivoDto: UpdateCultivoDto) {
    await this.cultivosRepository.update(id_cultivo, updateCultivoDto);
    return this.findOne(id_cultivo);
  }

  async remove(id_cultivo: number) {
    return await this.cultivosRepository.delete(id_cultivo);
  }
}
