import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from '../../movimientos/entities/movimiento.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';

@Injectable()
export class MovimientoSeeder {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) {}

  async seed() {
    const insumo = await this.insumoRepository.findOne({ where: { codigo: 'FER-A' } });
    if (!insumo) return;

    const entradaExists = await this.movimientoRepository.findOne({ where: { tipo_movimiento: 'Entrada', fecha_movimiento: '2025-08-22' } });
    if (!entradaExists) {
      await this.movimientoRepository.save(
        this.movimientoRepository.create({
          tipo_movimiento: 'Entrada',
          cantidad: 50,
          unidad_medida: 'kg',
          fecha_movimiento: '2025-08-22',
          id_insumo: insumo,
        }),
      );
    }

    const salidaExists = await this.movimientoRepository.findOne({ where: { tipo_movimiento: 'Salida', fecha_movimiento: '2025-10-12' } });
    if (!salidaExists) {
      await this.movimientoRepository.save(
        this.movimientoRepository.create({
          tipo_movimiento: 'Salida',
          cantidad: 20,
          unidad_medida: 'kg',
          fecha_movimiento: '2025-10-12',
          id_insumo: insumo,
        }),
      );
    }
  }
}