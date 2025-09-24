import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Realiza } from './entities/realiza.entity';
import { CreateRealizaDto } from './dto/create-realiza.dto';
import { UpdateRealizaDto } from './dto/update-realiza.dto';

@Injectable()
export class RealizaService {
  constructor(
    @InjectRepository(Realiza)
    private realizaRepository: Repository<Realiza>,
  ) {}

  async create(createRealizaDto: CreateRealizaDto) {
    const nuevoRegistro = this.realizaRepository.create(createRealizaDto);
    return await this.realizaRepository.save(nuevoRegistro);
  }

  async findAll() {
    return await this.realizaRepository.find();
  }

  async findOne(id_realiza: number) {
    return await this.realizaRepository.findOneBy({ id_realiza });
  }

  async update(id_realiza: number, updateRealizaDto: UpdateRealizaDto) {
    await this.realizaRepository.update(id_realiza, updateRealizaDto);
    return this.findOne(id_realiza);
  }

  async remove(id_realiza: number) {
    return await this.realizaRepository.delete(id_realiza);
  }
}
