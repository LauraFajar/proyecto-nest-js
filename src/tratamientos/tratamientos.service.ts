import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento)
    private tratamientosRepository: Repository<Tratamiento>,
  ) {}

  async create(createTratamientoDto: CreateTratamientoDto) {
    const nuevoTratamiento = this.tratamientosRepository.create(createTratamientoDto);
    return await this.tratamientosRepository.save(nuevoTratamiento);
  }

  async findAll() {
    return await this.tratamientosRepository.find();
  }

  async findOne(id_tratamiento: number) {
    return await this.tratamientosRepository.findOneBy({ id_tratamiento });
  }

  async update(id_tratamiento: number, updateTratamientoDto: UpdateTratamientoDto) {
    await this.tratamientosRepository.update(id_tratamiento, updateTratamientoDto);
    return this.findOne(id_tratamiento);
  }

  async remove(id_tratamiento: number) {
    return await this.tratamientosRepository.delete(id_tratamiento);
  }
}
