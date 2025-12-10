import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository, EntityManager, DeepPartial } from 'typeorm';
import { Salida } from './entities/salida.entity';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { InventarioService } from '../inventario/inventario.service';
import { Inventario } from '../inventario/entities/inventario.entity';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class SalidasService {
  constructor(
    @InjectRepository(Salida)
    private readonly salidasRepository: Repository<Salida>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>, 
    private readonly inventarioService: InventarioService,
    private readonly alertasService: AlertasService,
  ) {}

  async create(createSalidaDto: CreateSalidaDto, queryRunner?: QueryRunner): Promise<Salida> {
    console.log('DEBUG: SalidasService.create llamado con:', createSalidaDto);
    
    if (!createSalidaDto.id_insumo) {
      throw new NotFoundException('id_insumo es requerido para registrar una salida y ajustar inventario');
    }

    const salidaData: DeepPartial<Salida> = {
      nombre: createSalidaDto.nombre,
      codigo: createSalidaDto.codigo,
      cantidad: createSalidaDto.cantidad,
      observacion: createSalidaDto.observacion,
      fecha_salida: createSalidaDto.fecha_salida || new Date().toISOString().slice(0, 10),
      unidad_medida: createSalidaDto.unidad_medida ?? undefined,
      id_cultivo: createSalidaDto.id_cultivo ?? undefined,
      valor_unidad: createSalidaDto.valor_unidad ?? undefined,
      insumo: { id_insumo: createSalidaDto.id_insumo } as any,
    };

    console.log('DEBUG: Datos de salida a guardar:', salidaData);

    let savedSalida: Salida;
    if (queryRunner) {
      const newSalida = queryRunner.manager.create(Salida, salidaData);
      savedSalida = await queryRunner.manager.save(newSalida);
      console.log('DEBUG: Salida guardada con ID:', savedSalida.id_salida);
      const salidaWithRelation = await queryRunner.manager.findOne(Salida, {
        where: { id_salida: savedSalida.id_salida },
        relations: ['insumo']
      });
      if (!salidaWithRelation) {
        console.log('DEBUG: No se pudo encontrar la salida guardada');
        throw new NotFoundException('No se pudo encontrar la salida guardada');
      }
      console.log('DEBUG: Salida con relación cargada:', salidaWithRelation);
      savedSalida = salidaWithRelation;
    } else {
      const newSalida = this.salidasRepository.create(salidaData);
      savedSalida = await this.salidasRepository.save(newSalida);
      console.log('DEBUG: Salida guardada sin queryRunner con ID:', savedSalida.id_salida);
      const salidaWithRelation = await this.salidasRepository.findOne({
        where: { id_salida: savedSalida.id_salida },
        relations: ['insumo']
      });
      if (!salidaWithRelation) {
        console.log('DEBUG: No se pudo encontrar la salida guardada sin queryRunner');
        throw new NotFoundException('No se pudo encontrar la salida guardada');
      }
      console.log('DEBUG: Salida con relación cargada sin queryRunner:', salidaWithRelation);
      savedSalida = salidaWithRelation;
    }

    if (queryRunner) {
      const inventarioItem = await queryRunner.manager.findOne(Inventario, {
        where: { id_insumo: createSalidaDto.id_insumo },
        relations: ['insumo'],
      });
  
      if (!inventarioItem) {
        throw new NotFoundException(`No se encontró un item de inventario para el insumo con ID ${createSalidaDto.id_insumo}.`);
      }
  
      inventarioItem.cantidad_stock -= createSalidaDto.cantidad;
      const inventarioActualizado = await queryRunner.manager.save(inventarioItem);
  
      const UMBRAL_MINIMO = 50;
      if (inventarioActualizado.cantidad_stock < UMBRAL_MINIMO) {
        const now = new Date();
        await this.alertasService.create({
          tipo_alerta: 'Nivel bajo de stock',
          descripcion: `Alerta: El insumo con ID ${createSalidaDto.id_insumo} está por debajo del umbral mínimo.`,
          gravedad: 'ALTA',
          fecha: now.toISOString().split('T')[0],
          hora: now.toTimeString().split(' ')[0],
        });
      }
    } else {
      await this.inventarioService.reducirCantidad(createSalidaDto.id_insumo, createSalidaDto.cantidad);
    }

    return savedSalida;
  }

  async findAll(): Promise<Salida[]> {
    return this.salidasRepository.find({
      relations: ['insumo', 'cultivo'],
    });
  }

  async findOne(id: number): Promise<Salida> {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    return salida;
  }

  async update(id: number, updateSalidaDto: DeepPartial<Salida>): Promise<Salida> {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    await this.salidasRepository.update(id, updateSalidaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const salida = await this.salidasRepository.findOne({ where: { id_salida: id } });
    if (!salida) {
      throw new NotFoundException(`Salida con ID ${id} no encontrada.`);
    }
    await this.salidasRepository.delete(id);
  }
}
