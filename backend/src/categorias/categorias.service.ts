import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriasRepository: Repository<Categoria>,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    const nuevaCategoria = this.categoriasRepository.create(createCategoriaDto);
    return await this.categoriasRepository.save(nuevaCategoria);
  }

  async findAll() {
    return await this.categoriasRepository.find();
  }

  async findOne(id_categoria: number) {
    return await this.categoriasRepository.findOneBy({ id_categoria });
  }

  async update(id_categoria: number, updateCategoriaDto: UpdateCategoriaDto) {
    await this.categoriasRepository.update(id_categoria, updateCategoriaDto);
    return this.findOne(id_categoria);
  }

  async remove(id_categoria: number) {
    return await this.categoriasRepository.delete(id_categoria);
  }
}
