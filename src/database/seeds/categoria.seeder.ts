import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriaSeeder {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async seed() {
    const data = [
      {
        nombre: 'Herramientas',
        descripcion: 'Herramientas para el campo',
      },
      {
        nombre: 'Fertilizantes',
        descripcion: 'Fertilizantes para el crecimiento de las plantas',
      },
      {
        nombre: 'Semillas',
        descripcion: 'Semillas para la siembra',
      },
    ];

    for (const item of data) {
      const exists = await this.categoriaRepository.findOne({ where: { nombre: item.nombre } });
      if (!exists) {
        await this.categoriaRepository.save(this.categoriaRepository.create(item));
      }
    }
  }
}