import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tiporol } from './entities/tiporol.entity';
import { CreateTiporolDto } from './dto/create-tiporol.dto';
import { UpdateTiporolDto } from './dto/update-tiporol.dto';

@Injectable()
export class TiporolService {
  constructor(
    @InjectRepository(Tiporol)
    private tiporolRepository: Repository<Tiporol>,
  ) {}

  async create(createTiporolDto: CreateTiporolDto) {
    const nuevoTipoRol = this.tiporolRepository.create(createTiporolDto);
    return await this.tiporolRepository.save(nuevoTipoRol);
  }

  async findAll() {
    return await this.tiporolRepository.find();
  }

  async findOne(id_tipo_rol: number) {
    return await this.tiporolRepository.findOneBy({ id_tipo_rol });
  }

  async update(id_tipo_rol: number, updateTiporolDto: UpdateTiporolDto) {
    await this.tiporolRepository.update(id_tipo_rol, updateTiporolDto);
    return this.findOne(id_tipo_rol); 
  }

  async remove(id_tipo_rol: number) {
    return await this.tiporolRepository.delete(id_tipo_rol);
  }
}
