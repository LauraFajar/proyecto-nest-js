import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';

@Injectable()
export class CategoriaSeeder {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async seed() {
    const exists = await this.categoriaRepository.findOne({ where: { nombre: 'General' } });
    if (!exists) {
      await this.categoriaRepository.save(
        this.categoriaRepository.create({ nombre: 'General', descripcion: 'Categoría por defecto' }),
      );
    }
  }
}