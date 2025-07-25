import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
  ) {}

  async create(createInventarioDto: CreateInventarioDto) {
    const nuevoInventario = this.inventarioRepository.create(createInventarioDto);
    return await this.inventarioRepository.save(nuevoInventario);
  }

  async findAll() {
    return await this.inventarioRepository.find();
  }

  async findOne(id_inventario: number) {
    return await this.inventarioRepository.findOneBy({ id_inventario });
  }

  async update(id_inventario: number, updateInventarioDto: UpdateInventarioDto) {
    await this.inventarioRepository.update(id_inventario, updateInventarioDto);
    return this.findOne(id_inventario);
  }

  async remove(id_inventario: number) {
    return await this.inventarioRepository.delete(id_inventario);
  }
}
