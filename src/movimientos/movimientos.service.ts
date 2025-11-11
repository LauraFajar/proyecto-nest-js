import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private movimientosRepository: Repository<Movimiento>,
  ) {}

  async create(createMovimientoDto: CreateMovimientoDto) {
    // Asegurar relación con Insumo usando solo el id
    const nuevoMovimiento = this.movimientosRepository.create({
      ...createMovimientoDto,
      id_insumo: { id_insumo: createMovimientoDto.id_insumo } as any,
    });
    return await this.movimientosRepository.save(nuevoMovimiento);
  }

  async findAll() {
    return await this.movimientosRepository.find({
      relations: ['id_insumo', 'id_insumo.id_categoria', 'id_insumo.id_almacen'],
    });
  }

  async findOne(id_movimiento: number) {
    return await this.movimientosRepository.findOne({
      where: { id_movimiento },
      relations: ['id_insumo', 'id_insumo.id_categoria', 'id_insumo.id_almacen'],
    });
  }

  async update(id_movimiento: number, updateMovimientoDto: UpdateMovimientoDto) {
    // Mapear id_insumo numérico a relación para cumplir con el tipo de ManyToOne
    const toUpdate: any = { ...updateMovimientoDto };
    if (typeof updateMovimientoDto.id_insumo === 'number') {
      toUpdate.id_insumo = { id_insumo: updateMovimientoDto.id_insumo } as any;
    }
    await this.movimientosRepository.update(id_movimiento, toUpdate);
    return this.findOne(id_movimiento);
  }

  async remove(id_movimiento: number) {
    return await this.movimientosRepository.delete(id_movimiento);
  }
}
