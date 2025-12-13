import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from './entities/almacen.entity';
import { CreateAlmaceneDto } from './dto/create-almacene.dto';
import { UpdateAlmaceneDto } from './dto/update-almacene.dto';

@Injectable()
export class AlmacenesService {
  constructor(
    @InjectRepository(Almacen)
    private almacenesRepository: Repository<Almacen>,
  ) {}

  async create(createAlmaceneDto: CreateAlmaceneDto) {
    const nuevoAlmacen = this.almacenesRepository.create(createAlmaceneDto);
    return await this.almacenesRepository.save(nuevoAlmacen);
  }

  async findAll() {
    return await this.almacenesRepository.find();
  }

  async findOne(id_almacen: number) {
    return await this.almacenesRepository.findOneBy({ id_almacen });
  }

  async update(id_almacen: number, updateAlmaceneDto: UpdateAlmaceneDto) {
    await this.almacenesRepository.update(id_almacen, updateAlmaceneDto);
    return this.findOne(id_almacen); 
  }

  async remove(id_almacen: number) {
    return await this.almacenesRepository.delete(id_almacen);
  }
}
