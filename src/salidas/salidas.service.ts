import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salida } from './entities/salida.entity';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { InventarioService } from '../inventario/inventario.service';

@Injectable()
export class SalidasService {
  constructor(
    @InjectRepository(Salida)
    private readonly salidasRepository: Repository<Salida>,
    private readonly inventarioService: InventarioService,
  ) {}

  async create(createSalidaDto: CreateSalidaDto) {
    const nuevaSalida = this.salidasRepository.create(createSalidaDto);
    const salidaGuardada = await this.salidasRepository.save(nuevaSalida);

    if (salidaGuardada.insumo && salidaGuardada.insumo.id_insumo) {
      await this.inventarioService.reducirCantidad(
        salidaGuardada.insumo.id_insumo,
        salidaGuardada.cantidad,
      );
    } else {
      throw new NotFoundException(`El insumo para la salida no fue encontrado.`);
    }

    return salidaGuardada;
  }

  async findAll() {
    return this.salidasRepository.find();
  }

  async findOne(id: number) {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    return salida;
  }

  async update(id: number, updateSalidaDto: UpdateSalidaDto) {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    await this.salidasRepository.update(id, updateSalidaDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    await this.salidasRepository.delete(id);
  }
}