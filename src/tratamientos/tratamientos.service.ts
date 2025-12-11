import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { TratamientoInsumo } from './entities/tratamiento-insumo.entity';
import { Epa } from '../epa/entities/epa.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { CreateTratamientoDto, TratamientoInsumoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento)
    private readonly tratamientosRepository: Repository<Tratamiento>,
    @InjectRepository(Epa)
    private readonly epaRepository: Repository<Epa>,
    @InjectRepository(TratamientoInsumo)
    private readonly tratamientoInsumoRepository: Repository<TratamientoInsumo>,
    @InjectRepository(Insumo)
    private readonly insumosRepository: Repository<Insumo>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTratamientoDto: CreateTratamientoDto): Promise<Tratamiento> {
    const { insumos, ...tratamientoData } = createTratamientoDto;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const epa = await queryRunner.manager.findOne(Epa, { where: { id_epa: tratamientoData.id_epa } });
      if (!epa) {
        throw new NotFoundException(`Epa con ID ${tratamientoData.id_epa} no encontrado`);
      }

      const nuevoTratamiento = queryRunner.manager.create(Tratamiento, { ...tratamientoData, id_epa: epa });
      const tratamientoGuardado = await queryRunner.manager.save(nuevoTratamiento);

      if (insumos && insumos.length > 0) {
        for (const insumoDto of insumos) {
          await this.ajustarInventarioYRelacion(queryRunner, tratamientoGuardado.id_tratamiento, insumoDto, true);
        }
      }

      await queryRunner.commitTransaction();
      return tratamientoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el tratamiento: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async ajustarInventarioYRelacion(queryRunner: any, id_tratamiento: number, insumoDto: TratamientoInsumoDto, esNuevo: boolean) {
    const insumo = await queryRunner.manager.findOne(Insumo, { where: { id_insumo: insumoDto.id_insumo } });
    if (!insumo) throw new NotFoundException(`Insumo con ID ${insumoDto.id_insumo} no encontrado`);
    if (insumo.es_herramienta || insumo.tipo_insumo === 'herramienta') return; // No se consumen herramientas

    const inventario = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumo.id_insumo } });
    if (!inventario) throw new NotFoundException(`No existe inventario para el insumo ${insumo.nombre_insumo}`);

    const cantidadRequerida = Number(insumoDto.cantidad_usada);
    const stockActual = Number(inventario.cantidad_stock);

    if (stockActual < cantidadRequerida) {
      throw new BadRequestException(`Stock insuficiente para ${insumo.nombre_insumo}. Disponible: ${stockActual}, Requerido: ${cantidadRequerida}`);
    }

    inventario.cantidad_stock = stockActual - cantidadRequerida;
    await queryRunner.manager.save(inventario);

    if (esNuevo) {
      const tratamientoInsumo = queryRunner.manager.create(TratamientoInsumo, {
        id_tratamiento,
        id_insumo: insumo.id_insumo,
        cantidad_usada: cantidadRequerida,
        unidad_medida: insumoDto.unidad_medida || 'unidades'
      });
      await queryRunner.manager.save(tratamientoInsumo);
    }
  }
  
  async findAll(epaId?: number, tipo?: string) {
    // Esta función no necesita cambios y se mantiene como estaba
    try {
      const qb = this.tratamientosRepository.createQueryBuilder('tratamiento')
        .leftJoinAndSelect('tratamiento.id_epa', 'epa')
        .leftJoinAndSelect('tratamiento.tratamientoInsumos', 'tratamientoInsumos')
        .leftJoinAndSelect('tratamientoInsumos.id_insumos', 'insumos')
        .select([
          'tratamiento.id_tratamiento', 
          'tratamiento.descripcion', 
          'tratamiento.dosis', 
          'tratamiento.frecuencia',
          'tratamiento.tipo',
          'epa.id_epa', 
          'epa.nombre_epa',
          'tratamientoInsumos.id_tratamiento_insumo',
          'tratamientoInsumos.cantidad_usada',
          'tratamientoInsumos.unidad_medida',
          'insumos.id_insumo',
          'insumos.nombre_insumo'
        ]);

      if (typeof epaId === 'number' && Number.isFinite(epaId)) {
        qb.andWhere('epa.id_epa = :epaId', { epaId });
      }

      if (tipo) {
        const t = tipo.toString().trim().toLowerCase();
        const enumVal = t === 'biologico' ? 'Biologico' : t === 'quimico' ? 'Quimico' : undefined;
        if (enumVal) {
          qb.andWhere('tratamiento.tipo = :tipo', { tipo: enumVal });
        }
      }

      return await qb.getMany();
    } catch (error) {
      console.error('Error al obtener tratamientos:', error);
      return [];
    }
  }

  async findOne(id_tratamiento: number) {
    // Esta función no necesita cambios y se mantiene como estaba
    try {
      const tratamiento = await this.tratamientosRepository.createQueryBuilder('tratamiento')
        .leftJoinAndSelect('tratamiento.id_epa', 'epa')
        .leftJoinAndSelect('tratamiento.tratamientoInsumos', 'tratamientoInsumos')
        .leftJoinAndSelect('tratamientoInsumos.id_insumos', 'insumos')
        .select([
          'tratamiento.id_tratamiento', 
          'tratamiento.descripcion', 
          'tratamiento.dosis', 
          'tratamiento.frecuencia',
          'tratamiento.tipo',
          'epa.id_epa',
          'epa.nombre_epa',
          'tratamientoInsumos.id_tratamiento_insumo',
          'tratamientoInsumos.cantidad_usada',
          'tratamientoInsumos.unidad_medida',
          'insumos.id_insumo',
          'insumos.nombre_insumo'
        ])
        .where('tratamiento.id_tratamiento = :id', { id: id_tratamiento })
        .getOne();
      
      if (!tratamiento) {
        throw new NotFoundException(`Tratamiento con ID ${id_tratamiento} no encontrado`);
      }
      
      return tratamiento;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error al obtener tratamiento con ID ${id_tratamiento}:`, error);
      throw new InternalServerErrorException('Error al obtener el tratamiento');
    }
  }

  async update(id_tratamiento: number, updateTratamientoDto: UpdateTratamientoDto): Promise<Tratamiento> {

    
    const { insumos, ...tratamientoData } = updateTratamientoDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tratamiento = await queryRunner.manager.findOne(Tratamiento, { where: { id_tratamiento } });
      if (!tratamiento) {
        throw new NotFoundException(`Tratamiento con ID ${id_tratamiento} no encontrado`);
      }
  

      // Actualizar propiedades del tratamiento
      Object.assign(tratamiento, tratamientoData);
      if (tratamientoData.id_epa) {
        const epa = await queryRunner.manager.findOne(Epa, { where: { id_epa: tratamientoData.id_epa } });
        if (!epa) throw new NotFoundException(`EPA con ID ${tratamientoData.id_epa} no encontrado`);
        tratamiento.id_epa = epa;
      }
      await queryRunner.manager.save(tratamiento);
  

      if (insumos) {
        const insumosActuales = await queryRunner.manager.find(TratamientoInsumo, {
          where: { id_tratamiento },
          relations: ['id_insumos'],
        });

        const insumosActualesMap = new Map(insumosActuales.map(ti => [ti.id_insumos.id_insumo, ti]));
        const insumosNuevosMap = new Map(insumos.map(i => [i.id_insumo, i]));

        // 1. Insumos a eliminar: Reembolsar stock
        for (const actual of insumosActuales) {
          if (!insumosNuevosMap.has(actual.id_insumos.id_insumo)) {
            const insumoEntity = actual.id_insumos;
            if (!insumoEntity.es_herramienta && insumoEntity.tipo_insumo !== 'herramienta') {
              const inventario = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumoEntity.id_insumo } });
              if (inventario) {
                inventario.cantidad_stock = Number(inventario.cantidad_stock) + Number(actual.cantidad_usada);
                await queryRunner.manager.save(inventario);
              }
            }
            await queryRunner.manager.remove(actual);
          }
        }

        // 2. Insumos a añadir o actualizar
        for (const insumoDto of insumos) {
          const insumoEntity = await queryRunner.manager.findOne(Insumo, { where: { id_insumo: insumoDto.id_insumo } });
          if (!insumoEntity) throw new NotFoundException(`Insumo con ID ${insumoDto.id_insumo} no encontrado`);
          if (insumoEntity.es_herramienta || insumoEntity.tipo_insumo === 'herramienta') continue;
          
          const actual = insumosActualesMap.get(insumoDto.id_insumo);
          const cantidadNueva = Number(insumoDto.cantidad_usada);
          const cantidadAnterior = actual ? Number(actual.cantidad_usada) : 0;
          const diferencia = cantidadNueva - cantidadAnterior;

          if (diferencia !== 0) {
            const inventario = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumoEntity.id_insumo } });
            if (!inventario) throw new NotFoundException(`Inventario para el insumo ${insumoEntity.nombre_insumo} no encontrado.`);
            
            const stockActual = Number(inventario.cantidad_stock);
            if (stockActual < diferencia) {
              throw new BadRequestException(`Stock insuficiente para ${insumoEntity.nombre_insumo}. Disponible: ${stockActual}, ajuste requerido: ${diferencia}`);
            }
            inventario.cantidad_stock = stockActual - diferencia;
            await queryRunner.manager.save(inventario);
          }

          if (actual) { // Actualizar existente
            actual.cantidad_usada = cantidadNueva;
            actual.unidad_medida = insumoDto.unidad_medida || actual.unidad_medida;
            await queryRunner.manager.save(actual);
          } else { // Crear nuevo
            const nuevoInsumo = queryRunner.manager.create(TratamientoInsumo, {
              id_tratamiento: tratamiento.id_tratamiento,
              id_insumo: insumoDto.id_insumo,
              cantidad_usada: cantidadNueva,
              unidad_medida: insumoDto.unidad_medida
            });
            await queryRunner.manager.save(nuevoInsumo);
          }
        }
      }

      await queryRunner.commitTransaction();
      const updatedTratamiento = await this.tratamientosRepository.findOne({ where: { id_tratamiento }, relations: ['id_epa', 'tratamientoInsumos', 'tratamientoInsumos.id_insumos'] });
      if (!updatedTratamiento) {
        throw new InternalServerErrorException('No se pudo encontrar el tratamiento después de la actualización.');
      }
      return updatedTratamiento;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('DEBUG: Error en actualización de tratamiento:', error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        console.error('DEBUG: Error de negocio:', error.message);
        throw error;
      }
      
      console.error('DEBUG: Error interno del servidor:', error.message);
      throw new InternalServerErrorException('Error al actualizar el tratamiento: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id_tratamiento: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tratamiento = await queryRunner.manager.findOne(Tratamiento, {
        where: { id_tratamiento },
        relations: ['tratamientoInsumos', 'tratamientoInsumos.id_insumos'],
      });

      if (!tratamiento) {
        throw new NotFoundException(`Tratamiento con ID ${id_tratamiento} no encontrado`);
      }

      // Reembolsar todos los insumos consumibles al inventario
      for (const tratamientoInsumo of tratamiento.tratamientoInsumos) {
        const insumo = tratamientoInsumo.id_insumos;
        if (!insumo.es_herramienta && insumo.tipo_insumo !== 'herramienta') {
          const inventario = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumo.id_insumo } });
          if (inventario) {
            inventario.cantidad_stock = Number(inventario.cantidad_stock) + Number(tratamientoInsumo.cantidad_usada);
            await queryRunner.manager.save(inventario);
          }
        }
      }

      await queryRunner.manager.remove(TratamientoInsumo, tratamiento.tratamientoInsumos);
      await queryRunner.manager.remove(tratamiento);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el tratamiento: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
