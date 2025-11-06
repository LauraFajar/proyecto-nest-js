import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';

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
    const exists = await this.insumoRepository.findOne({ where: { codigo: 'FER-A' } });
    if (!exists) {
      const categoria = await this.categoriaRepository.findOne({ where: { nombre: 'General' } });
      const almacen = await this.almacenRepository.findOne({ where: { nombre_almacen: 'Principal' } });
      const insumo = this.insumoRepository.create({
        nombre_insumo: 'Fertilizante A',
        codigo: 'FER-A',
        fecha_entrada: '2025-08-20',
        observacion: 'Lote inicial de fertilizante',
        // Relaciones: si no existen, omitir el campo en lugar de usar null
        id_categoria: categoria ?? undefined,
        id_almacen: almacen ?? undefined,
      } as DeepPartial<Insumo>);
      await this.insumoRepository.save(insumo);
    }
  }
}