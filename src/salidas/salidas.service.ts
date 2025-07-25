import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salida } from './entities/salida.entity';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';

@Injectable()
export class SalidasService {
  constructor(
    @InjectRepository(Salida)
    private salidasRepository: Repository<Salida>,
  ) {}

  async create(createSalidaDto: CreateSalidaDto) {
    const nuevaSalida = this.salidasRepository.create(createSalidaDto);
    return await this.salidasRepository.save(nuevaSalida);
  }

  async findAll() {
    return await this.salidasRepository.find();
  }

  async findOne(id_salida: number) {
    return await this.salidasRepository.findOneBy({ id_salida });
  }

  async update(id_salida: number, updateSalidaDto: UpdateSalidaDto) {
    await this.salidasRepository.update(id_salida, updateSalidaDto);
    return this.findOne(id_salida); 
  }

  async remove(id_salida: number) {
    return await this.salidasRepository.delete(id_salida);
  }
}
