import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movimiento } from '../../movimientos/entities/movimiento.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MovimientoSeeder {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const data = [
      {
        tipo_movimiento: 'entrada',
        id_insumo: 1,
        cantidad: 100,
        unidad_medida: 'kg',
        fecha_movimiento: '2024-01-05',
      },
      {
        tipo_movimiento: 'salida',
        id_insumo: 1,
        cantidad: 20,
        unidad_medida: 'kg',
        fecha_movimiento: '2024-02-01',
      },
    ];

      for (const item of data) {
        const insumo = await this.insumoRepository.findOne({ where: { id_insumo: item.id_insumo } });
        if (insumo) {
          const exists = await this.movimientoRepository.findOne({ where: { tipo_movimiento: item.tipo_movimiento, fecha_movimiento: item.fecha_movimiento, id_insumo: { id_insumo: insumo.id_insumo } } });
          if (!exists) {
            const movimientoToCreate = {
              tipo_movimiento: item.tipo_movimiento,
              cantidad: item.cantidad,
              unidad_medida: item.unidad_medida,
              fecha_movimiento: item.fecha_movimiento,
              id_insumo: insumo,
            };
            await this.movimientoRepository.save(this.movimientoRepository.create(movimientoToCreate));
          }
        }
      }
  }
}