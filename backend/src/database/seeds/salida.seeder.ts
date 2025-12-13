import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Salida } from '../../salidas/entities/salida.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Repository } from 'typeorm';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Injectable()
export class SalidaSeeder {
  constructor(
    @InjectRepository(Salida)
    private readonly salidaRepository: Repository<Salida>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  async seed() {
    const categoria = await this.categoriaRepository.findOne({
      where: { id_categoria: 2 },
    });
    const almacen = await this.almacenRepository.findOne({
      where: { id_almacen: 1 },
    });
    const insumo = await this.insumoRepository.findOne({
      where: { id_insumo: 1 },
    });
    const cultivoPlatano = await this.cultivoRepository.findOne({
      where: { id_cultivo: 1 },
    });

    if (categoria && almacen && insumo) {
      const inventarioItem = await this.inventarioRepository.findOne({
        where: { id_insumo: insumo.id_insumo },
      });
      const unidad = inventarioItem?.unidad_medida || 'unidad';
      const data = [
        {
          cantidad: 30,
          id_categoria: categoria.id_categoria,
          id_almacen: almacen.id_almacen,
          observacion: 'Fertilizante para plátano',
          fecha_salida: '2024-03-12',
          valor_unidad: 28000,
          estado: 'completado',
          id_insumo: insumo.id_insumo,
          id_cultivo: cultivoPlatano?.id_cultivo,
          unidad_medida: unidad,
        },
        {
          cantidad: 15,
          id_categoria: categoria.id_categoria,
          id_almacen: almacen.id_almacen,
          observacion: 'Herbicida en plátano',
          fecha_salida: '2024-04-02',
          valor_unidad: 35000,
          estado: 'completado',
          id_insumo: insumo.id_insumo,
          id_cultivo: cultivoPlatano?.id_cultivo,
          unidad_medida: unidad,
        },
      ];

      for (const item of data) {
        const exists = await this.salidaRepository
          .createQueryBuilder('s')
          .select('s.id_salida')
          .where('s.observacion = :obs', { obs: item.observacion })
          .andWhere('s.fecha_salida = :fecha', { fecha: item.fecha_salida })
          .getOne();
        if (!exists) {
          await this.salidaRepository.query(
            `INSERT INTO salidas (nombre, codigo, cantidad, observacion, fecha_salida, valor_unidad, unidad_medida, estado, id_insumo, id_cultivo, id_categorias, id_almacenes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              insumo.nombre_insumo || 'Salida',
              insumo.codigo || 'SAL-001',
              item.cantidad,
              item.observacion,
              item.fecha_salida,
              item.valor_unidad ?? null,
              item.unidad_medida ?? unidad,
              item.estado ?? 'completado',
              item.id_insumo ?? insumo.id_insumo,
              item.id_cultivo ?? null,
              categoria.id_categoria,
              almacen.id_almacen,
            ],
          );
        }
      }
    }
  }
}
