import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { AlertasService } from '../alertas/alertas.service';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    private readonly alertasService: AlertasService,
  ) {}

  async create(createInventarioDto: any) {
    // Mapear id_insumo numérico a la relación Insumo
    const payload: any = { ...createInventarioDto };
    if (createInventarioDto?.id_insumo) {
      payload.insumo = { id_insumo: createInventarioDto.id_insumo } as any;
      delete payload.id_insumo;
    }
    const nuevoInventario = this.inventarioRepository.create(payload);
    return await this.inventarioRepository.save(nuevoInventario);
  }

  async findAll(paginationDto?: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};

    const [items, total] = await this.inventarioRepository.findAndCount({
      relations: ['insumo'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id_inventario: 'DESC' },
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const inventario = await this.inventarioRepository.findOne({ 
      where: { id_inventario: id },
      relations: ['insumo'],
    });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado.`);
    }
    return inventario;
  }

  async update(id: number, updateInventarioDto: any) {
    const inventario = await this.inventarioRepository.findOne({ where: { id_inventario: id } });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado.`);
    }
    // Mapear id_insumo numérico a la relación Insumo si viene en el payload
    const payload: any = { ...updateInventarioDto };
    if (updateInventarioDto?.id_insumo) {
      payload.insumo = { id_insumo: updateInventarioDto.id_insumo } as any;
      delete payload.id_insumo;
    }
    await this.inventarioRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: number) {
    const inventario = await this.inventarioRepository.findOne({ where: { id_inventario: id } });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado.`);
    }
    await this.inventarioRepository.delete(id);
  }

  // Métodos de reportes integrados
  async obtenerReporteInventario(stock_minimo?: number) {
    const query = this.inventarioRepository.createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.insumo', 'insumo');

    if (stock_minimo) {
      query.where('inventario.cantidad_stock <= :stock_minimo', { stock_minimo });
    }

    const inventario = await query.getMany();

    return {
      total_items: inventario.length,
      items_stock_bajo: inventario.filter(i => i.cantidad_stock <= (stock_minimo || 10)).length,
      cantidad_total_stock: inventario.reduce((sum, i) => sum + i.cantidad_stock, 0),
      inventario,
    };
  }

  async obtenerStockBajo(limite: number = 10) {
    const inventario = await this.inventarioRepository.createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.insumo', 'insumo')
      .where('inventario.cantidad_stock <= :limite', { limite })
      .getMany();

    return {
      items_stock_bajo: inventario.length,
      limite_configurado: limite,
      items: inventario,
    };
  }

  async obtenerEstadisticas() {
    const inventario = await this.inventarioRepository.find({
      relations: ['insumo'],
    });

    return {
      total_items: inventario.length,
      cantidad_total: inventario.reduce((sum, i) => sum + i.cantidad_stock, 0),
      stock_promedio: inventario.length > 0 ? 
        inventario.reduce((sum, i) => sum + i.cantidad_stock, 0) / inventario.length : 0,
      items_por_insumo: this.agruparPorInsumo(inventario),
    };
  }

  private agruparPorInsumo(inventario: Inventario[]) {
    return inventario.reduce((acc, item) => {
      const insumo = item.insumo?.nombre_insumo || 'Sin insumo';
      acc[insumo] = (acc[insumo] || 0) + item.cantidad_stock;
      return acc;
    }, {} as Record<string, number>);
  }

  async reducirCantidad(id_insumo: number, cantidadReducir: number) {
    const inventarioItem = await this.inventarioRepository.findOne({
      where: { insumo: { id_insumo: id_insumo } },
      relations: ['insumo'],
    });

    if (!inventarioItem) {
      throw new NotFoundException(`Item de inventario con ID ${id_insumo} no encontrado.`);
    }

    inventarioItem.cantidad_stock -= cantidadReducir;
    const inventarioActualizado = await this.inventarioRepository.save(inventarioItem);

    const UMBRAL_MINIMO = 50;
    if (inventarioActualizado.cantidad_stock < UMBRAL_MINIMO) {
      const now = new Date();
      await this.alertasService.create({
        tipo_alerta: 'Nivel bajo de stock',
        descripcion: `Alerta: El insumo con ID ${id_insumo} está por debajo del umbral mínimo.`,
        gravedad: 'ALTA',
        fecha: now.toISOString().split('T')[0],
        hora: now.toTimeString().split(' ')[0],
      });
    }

    return inventarioActualizado;
  }
}