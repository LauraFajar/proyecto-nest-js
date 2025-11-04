import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InsumoSeeder {
  constructor(
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
  ) {}

  async seed() {
    const data = [
      {
        nombre_insumo: 'Fertilizante NPK',
        codigo: 'FER-001',
        fecha_entrada: '2024-01-05',
        observacion: 'Sacos de 50kg',
        id_categoria: 2,
        id_almacen: 1,
      },
      {
        nombre_insumo: 'Semillas de Cacao',
        codigo: 'SEM-001',
        fecha_entrada: '2024-02-10',
        observacion: 'Bolsas de 20kg',
        id_categoria: 3,
        id_almacen: 1,
      },
    ];

    for (const item of data) {
      const categoria = await this.categoriaRepository.findOne({ where: { id_categoria: item.id_categoria } });
      const almacen = await this.almacenRepository.findOne({ where: { id_almacen: item.id_almacen } });
      if (categoria && almacen) {
        const exists = await this.insumoRepository.findOne({ where: { codigo: item.codigo } });
        if (!exists) {
          const { id_categoria, id_almacen, ...rest } = item;
          const newInsumo = this.insumoRepository.create({ ...rest, id_categoria: categoria, id_almacen: almacen });
          await this.insumoRepository.save(newInsumo);
        }
      }
    }
  }
}