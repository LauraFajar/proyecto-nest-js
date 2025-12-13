import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { AlertasService } from '../alertas/alertas.service';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    private readonly alertasService: AlertasService,
  ) {}

  async create(createInventarioDto: CreateInventarioDto) {
    const nuevoInventario =
      this.inventarioRepository.create(createInventarioDto);
    return await this.inventarioRepository.save(nuevoInventario);
  }

  async findAll() {
    return await this.inventarioRepository.find({
      relations: ['insumo'],
    });
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

  async update(id: number, updateInventarioDto: UpdateInventarioDto) {
    const inventario = await this.inventarioRepository.findOne({
      where: { id_inventario: id },
    });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado.`);
    }
    await this.inventarioRepository.update(id, updateInventarioDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const inventario = await this.inventarioRepository.findOne({
      where: { id_inventario: id },
    });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado.`);
    }
    await this.inventarioRepository.delete(id);
  }

  // Métodos de reportes integrados
  async obtenerReporteInventario(stock_minimo?: number) {
    const query = this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.insumo', 'insumo');

    if (stock_minimo) {
      query.where('inventario.cantidad_stock <= :stock_minimo', {
        stock_minimo,
      });
    }

    const inventario = await query.getMany();

    return {
      total_items: inventario.length,
      items_stock_bajo: inventario.filter(
        (i) => i.cantidad_stock <= (stock_minimo || 10),
      ).length,
      cantidad_total_stock: inventario.reduce(
        (sum, i) => sum + i.cantidad_stock,
        0,
      ),
      inventario,
    };
  }

  async obtenerStockBajo(limite: number = 10) {
    const inventario = await this.inventarioRepository
      .createQueryBuilder('inventario')
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
      stock_promedio:
        inventario.length > 0
          ? inventario.reduce((sum, i) => sum + i.cantidad_stock, 0) /
            inventario.length
          : 0,
      items_por_insumo: this.agruparPorInsumo(inventario),
    };
  }

  private agruparPorInsumo(inventario: Inventario[]) {
    return inventario.reduce(
      (acc, item) => {
        const insumo = item.insumo?.nombre_insumo || 'Sin insumo';
        acc[insumo] = (acc[insumo] || 0) + item.cantidad_stock;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async reducirCantidad(id_insumo: number, cantidadReducir: number) {
    const inventarioItem = await this.inventarioRepository.findOne({
      where: { id_insumo: id_insumo },
      relations: ['insumo'],
    });

    if (!inventarioItem) {
      throw new NotFoundException(
        `No se encontró un item de inventario para el insumo con ID ${id_insumo}.`,
      );
    }

    inventarioItem.cantidad_stock -= cantidadReducir;
    const inventarioActualizado =
      await this.inventarioRepository.save(inventarioItem);

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
