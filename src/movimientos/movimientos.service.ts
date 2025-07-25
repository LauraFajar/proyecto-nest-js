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
    const nuevoMovimiento = this.movimientosRepository.create(createMovimientoDto);
    return await this.movimientosRepository.save(nuevoMovimiento);
  }

  async findAll() {
    return await this.movimientosRepository.find();
  }

  async findOne(id_movimiento: number) {
    return await this.movimientosRepository.findOneBy({ id_movimiento });
  }

  async update(id_movimiento: number, updateMovimientoDto: UpdateMovimientoDto) {
    await this.movimientosRepository.update(id_movimiento, updateMovimientoDto);
    return this.findOne(id_movimiento);
  }

  async remove(id_movimiento: number) {
    return await this.movimientosRepository.delete(id_movimiento);
  }
}
