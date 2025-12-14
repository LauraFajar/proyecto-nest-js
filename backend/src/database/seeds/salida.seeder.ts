import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SalidaSeeder.name);

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
    try {
      this.logger.log('Starting Salida seeder...');
      
      const [categoria, almacen, insumo, cultivoPlatano] = await Promise.all([
        this.categoriaRepository.findOne({ where: { id_categoria: 2 } }),
        this.almacenRepository.findOne({ where: { id_almacen: 1 } }),
        this.insumoRepository.findOne({ where: { id_insumo: 1 } }),
        this.cultivoRepository.findOne({ where: { id_cultivo: 1 } }),
      ]);

      if (!categoria || !almacen || !insumo) {
        this.logger.warn('Required entities not found. Skipping Salida seeder.');
        if (!categoria) this.logger.warn('Categoria with id 2 not found');
        if (!almacen) this.logger.warn('Almacen with id 1 not found');
        if (!insumo) this.logger.warn('Insumo with id 1 not found');
        return;
      }

      const inventarioItem = await this.inventarioRepository.findOne({
        where: { insumo: { id_insumo: insumo.id_insumo } },
      });
      
      const unidad = inventarioItem?.unidad_medida || 'unidad';
      
      const salidasData = [
        {
          nombre: insumo.nombre_insumo || 'Salida',
          codigo: insumo.codigo || 'SAL-001',
          cantidad: 30,
          observacion: 'Fertilizante para plátano',
          fecha_salida: '2024-03-12',
          valor_unidad: 28000,
          unidad_medida: unidad,
          estado: 'completado',
          insumo: insumo,
          cultivo: cultivoPlatano || null,
          categoria: categoria,
          almacen: almacen,
        },
        {
          nombre: insumo.nombre_insumo || 'Salida',
          codigo: insumo.codigo || 'SAL-002',
          cantidad: 15,
          observacion: 'Herbicida en plátano',
          fecha_salida: '2024-04-02',
          valor_unidad: 35000,
          unidad_medida: unidad,
          estado: 'completado',
          insumo: insumo,
          cultivo: cultivoPlatano || null,
          categoria: categoria,
          almacen: almacen,
        },
      ];

      for (const item of salidasData) {
        const exists = await this.salidaRepository.findOne({
          where: {
            observacion: item.observacion,
            fecha_salida: item.fecha_salida,
            insumo: { id_insumo: insumo.id_insumo },
          },
        });

        if (!exists) {
          const salidaToCreate = this.salidaRepository.create(item);
          await this.salidaRepository.save(salidaToCreate);
          this.logger.log(`Created salida: ${item.observacion} on ${item.fecha_salida}`);
        } else {
          this.logger.log(`Salida already exists: ${item.observacion} on ${item.fecha_salida}`);
        }
      }
      
      this.logger.log('Salida seeder completed successfully');
    } catch (error) {
      this.logger.error(`Error in Salida seeder: ${error.message}`, error.stack);
      throw error;
    }
  }
}
