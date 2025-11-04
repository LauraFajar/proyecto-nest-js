import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Salida } from '../../salidas/entities/salida.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Almacen } from '../../almacenes/entities/almacen.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Repository } from 'typeorm';

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
  ) {}

  async seed() {
    const categoria = await this.categoriaRepository.findOne({ where: { id_categoria: 2 } });
    const almacen = await this.almacenRepository.findOne({ where: { id_almacen: 1 } });
    const insumo = await this.insumoRepository.findOne({ where: { id_insumo: 1 } });

    if (categoria && almacen && insumo) {
      const data = {
        cantidad: 20,
        id_categoria: categoria.id_categoria,
        id_almacen: almacen.id_almacen,
        observacion: 'Uso en cultivo de cacao',
        fecha_salida: '2024-02-01',
        valor_unidad: 25.00,
        estado: 'completado',
        id_insumo: insumo.id_insumo,
      };

      const exists = await this.salidaRepository.findOne({ where: { observacion: data.observacion } });
      if (!exists) {
        await this.salidaRepository.save(this.salidaRepository.create(data));
      }
    }
  }
}