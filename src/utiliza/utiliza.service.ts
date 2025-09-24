import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utiliza } from './entities/utiliza.entity';
import { CreateUtilizaDto } from './dto/create-utiliza.dto';
import { UpdateUtilizaDto } from './dto/update-utiliza.dto';

@Injectable()
export class UtilizaService {
  constructor(
    @InjectRepository(Utiliza)
    private utilizaRepository: Repository<Utiliza>,
  ) {}

  async create(createUtilizaDto: CreateUtilizaDto) {
    const nuevoRegistro = this.utilizaRepository.create(createUtilizaDto);
    return await this.utilizaRepository.save(nuevoRegistro);
  }

  async findAll() {
    return await this.utilizaRepository.find();
  }

  async findOne(id_utiliza: number) {
    return await this.utilizaRepository.findOneBy({ id_utiliza });
  }

  async update(id_utiliza: number, updateUtilizaDto: UpdateUtilizaDto) {
    await this.utilizaRepository.update(id_utiliza, updateUtilizaDto);
    return this.findOne(id_utiliza); 
  }

  async remove(id_utiliza: number) {
    return await this.utilizaRepository.delete(id_utiliza);
  }
}
