import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Salida } from '../salidas/entities/salida.entity';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private movimientosRepository: Repository<Movimiento>,
    @InjectRepository(Insumo)
    private insumosRepository: Repository<Insumo>,
    @InjectRepository(Salida)
    private salidasRepository: Repository<Salida>,
  ) {}

  async create(createMovimientoDto: CreateMovimientoDto) {
    const { id_insumo, ...rest } = createMovimientoDto;

    const insumo = await this.insumosRepository.findOne({ where: { id_insumo } });
    if (!insumo) {
      throw new NotFoundException(`Insumo con ID ${id_insumo} no encontrado`);
    }

    const nuevoMovimiento = this.movimientosRepository.create({
      ...rest,
      id_insumo: insumo,
    });

    const guardado = await this.movimientosRepository.save(nuevoMovimiento);

    // Si es una salida y viene id_cultivo, registrar también una salida financiera
    if (String(rest.tipo_movimiento).toLowerCase() === 'salida' && (rest as any)?.id_cultivo) {
      try {
        const salida = this.salidasRepository.create({
          nombre: insumo.nombre_insumo,
          codigo: insumo.codigo,
          cantidad: rest.cantidad,
          observacion: 'Salida registrada desde movimientos',
          fecha_salida: rest.fecha_movimiento,
          unidad_medida: rest.unidad_medida,
          id_cultivo: (rest as any).id_cultivo,
          insumo: insumo as any,
          valor_unidad: (rest as any).valor_unidad ?? null,
        } as any);
        await this.salidasRepository.save(salida);
      } catch {}
    }

    return await this.findOne(guardado.id_movimiento);
  }

  async findAll() {
      relations: ['id_insumo', 'id_insumo.id_categoria', 'id_insumo.id_almacen'],
    });
  }

  async findOne(id_movimiento: number) {
    return await this.movimientosRepository.findOne({
      where: { id_movimiento },
      relations: ['id_insumo'],
    });
  }

  async update(id_movimiento: number, updateMovimientoDto: UpdateMovimientoDto) {
    const { id_insumo, ...rest } = updateMovimientoDto as any;

    const updateData: Partial<Movimiento> = { ...rest } as Partial<Movimiento>;

    if (id_insumo !== undefined) {
      const insumo = await this.insumosRepository.findOne({ where: { id_insumo } });
      if (!insumo) {
        throw new NotFoundException(`Insumo con ID ${id_insumo} no encontrado`);
      }
      updateData.id_insumo = insumo;
    }

    await this.movimientosRepository.update(id_movimiento, updateData as any);
    return this.findOne(id_movimiento);
  }

  async remove(id_movimiento: number) {
    return await this.movimientosRepository.delete(id_movimiento);
  }
}
