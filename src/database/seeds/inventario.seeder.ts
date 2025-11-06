import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Injectable()
export class InventarioSeeder {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const insumo = await this.insumoRepository.findOne({ where: { codigo: 'FER-A' } });
    if (!insumo) return;

    const exists = await this.inventarioRepository.findOne({ where: { insumo: { id_insumo: insumo.id_insumo } } });
    if (!exists) {
      const inv = this.inventarioRepository.create({
        cantidad_stock: 120,
        unidad_medida: 'kg',
        fecha: '2025-08-20',
        insumo,
      });
      await this.inventarioRepository.save(inv);
    }
  }
}