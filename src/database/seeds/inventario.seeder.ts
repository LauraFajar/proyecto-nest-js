import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { Insumo } from 'src/insumos/entities/insumo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InventarioSeeder {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const data = [
      {
        cantidad_stock: 100,
        unidad_medida: 'kg',
        fecha: '2024-07-28',
        id_insumo: 1,
      },
      {
        cantidad_stock: 50,
        unidad_medida: 'kg',
        fecha: '2024-07-28',
        id_insumo: 2,
      },
    ];

    for (const item of data) {
      const insumo = await this.insumoRepository.findOne({ where: { id_insumo: item.id_insumo } });
      if (insumo) {
        const exists = await this.inventarioRepository.findOne({ where: { insumo: { id_insumo: insumo.id_insumo } } });
        if (!exists) {
          const { id_insumo, ...rest } = item;
          const newInventario = this.inventarioRepository.create({ ...rest, insumo });
          await this.inventarioRepository.save(newInventario);
        }
      }
    }
  }
}