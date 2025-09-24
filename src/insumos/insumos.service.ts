import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insumo } from './entities/insumo.entity';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(
    @InjectRepository(Insumo)
    private insumosRepository: Repository<Insumo>,
  ) {}

  async create(createInsumoDto: CreateInsumoDto) {
    const nuevoInsumo = this.insumosRepository.create(createInsumoDto);
    return await this.insumosRepository.save(nuevoInsumo);
  }

  async findAll() {
    return await this.insumosRepository.find();
  }

  async findOne(id_insumo: number) {
    return await this.insumosRepository.findOneBy({ id_insumo });
  }

  async update(id_insumo: number, updateInsumoDto: UpdateInsumoDto) {
    await this.insumosRepository.update(id_insumo, updateInsumoDto);
    return this.findOne(id_insumo); 
  }

  async remove(id_insumo: number) {
    return await this.insumosRepository.delete(id_insumo);
  }
}
