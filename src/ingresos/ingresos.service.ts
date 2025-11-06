import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso } from './entities/ingreso.entity';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';

@Injectable()
export class IngresosService {
  constructor(
    @InjectRepository(Ingreso)
    private ingresosRepository: Repository<Ingreso>,
  ) {}

  async create(createIngresoDto: CreateIngresoDto) {
    const nuevoIngreso = this.ingresosRepository.create(createIngresoDto);
    return await this.ingresosRepository.save(nuevoIngreso);
  }

  async findAll() {
    return await this.ingresosRepository.find({ relations: ['id_insumo'] });
  }

  async findOne(id_ingreso: number) {
    return await this.ingresosRepository.findOne({ where: { id_ingreso }, relations: ['id_insumo'] });
  }

  async update(id_ingreso: number, updateIngresoDto: UpdateIngresoDto) {
    await this.ingresosRepository.update(id_ingreso, updateIngresoDto);
    return this.findOne(id_ingreso); 
  }

  async remove(id_ingreso: number) {
    return await this.ingresosRepository.delete(id_ingreso);
  }
}
