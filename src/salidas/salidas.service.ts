import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
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
    // Mapear id_insumo numérico a la relación Insumo y tipar correctamente
    const payload: DeepPartial<Salida> = { ...(createSalidaDto as any) };
    if (createSalidaDto?.id_insumo) {
      payload.insumo = { id_insumo: createSalidaDto.id_insumo } as any;
      delete (payload as any).id_insumo;
    }
    const nuevaSalida = this.salidasRepository.create(payload);
    const salidaGuardada: Salida = await this.salidasRepository.save(nuevaSalida);

    // Re-cargar la salida con la relación de Insumo para garantizar tipos y datos
    const salidaConRelacion = await this.salidasRepository.findOne({
      where: { id_salida: salidaGuardada.id_salida },
      relations: ['insumo'],
    });

    if (salidaConRelacion?.insumo?.id_insumo) {
      await this.inventarioService.reducirCantidad(
        salidaConRelacion.insumo.id_insumo,
        salidaConRelacion.cantidad,
      );
    } else {
      throw new NotFoundException(`El insumo para la salida no fue encontrado.`);
    }

    return salidaConRelacion ?? salidaGuardada;
  }

  async findAll() {
    return this.salidasRepository.find({ relations: ['insumo'] });
  }

  async findOne(id: number) {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id }, relations: ['insumo'] });
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