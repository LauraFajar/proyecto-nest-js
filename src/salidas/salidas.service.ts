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
    const salida = this.salidasRepository.create({
      nombre: createSalidaDto.nombre,
      codigo: createSalidaDto.codigo,
      cantidad: createSalidaDto.cantidad,
      observacion: createSalidaDto.observacion,
      fecha_salida: createSalidaDto.fecha_salida || new Date().toISOString().slice(0, 10),
      unidad_medida: createSalidaDto.unidad_medida ?? null,
      id_cultivo: createSalidaDto.id_cultivo ?? null,
      valor_unidad: createSalidaDto.valor_unidad ?? null,
      ...(createSalidaDto.id_insumo ? { insumo: { id_insumo: createSalidaDto.id_insumo } as any } : {}),
    } as any);

    const saved = await this.salidasRepository.save(salida);

    if (createSalidaDto.id_insumo) {
      await this.inventarioService.reducirCantidad(createSalidaDto.id_insumo, createSalidaDto.cantidad);
    } else {
      throw new NotFoundException('id_insumo es requerido para registrar una salida y ajustar inventario');
    }

    return saved;
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
