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
    const payload: any = { ...createInsumoDto };
    if (typeof createInsumoDto.id_categoria === 'number') {
      payload.id_categoria = { id_categoria: createInsumoDto.id_categoria } as any;
    }
    if (typeof createInsumoDto.id_almacen === 'number') {
      payload.id_almacen = { id_almacen: createInsumoDto.id_almacen } as any;
    }
    const nuevoInsumo = this.insumosRepository.create(payload);
    return await this.insumosRepository.save(nuevoInsumo);
  }

  async findAll() {
    return await this.insumosRepository.find({ relations: ['id_categoria', 'id_almacen'] });
  }

  async findOne(id_insumo: number) {
    return await this.insumosRepository.findOne({ where: { id_insumo }, relations: ['id_categoria', 'id_almacen'] });
  }

  async update(id_insumo: number, updateInsumoDto: UpdateInsumoDto) {
    const toUpdate: any = { ...updateInsumoDto };
    if (typeof updateInsumoDto.id_categoria === 'number') {
      toUpdate.id_categoria = { id_categoria: updateInsumoDto.id_categoria } as any;
    }
    if (typeof updateInsumoDto.id_almacen === 'number') {
      toUpdate.id_almacen = { id_almacen: updateInsumoDto.id_almacen } as any;
    }
    await this.insumosRepository.update(id_insumo, toUpdate);
    return this.findOne(id_insumo); 
  }

  async remove(id_insumo: number) {
    return await this.insumosRepository.delete(id_insumo);
  }
}
