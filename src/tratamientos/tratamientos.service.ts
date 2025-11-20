import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { Epa } from '../epa/entities/epa.entity';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento)
    private tratamientosRepository: Repository<Tratamiento>,
    @InjectRepository(Epa)
    private epaRepository: Repository<Epa>,
  ) {}

  async create(createTratamientoDto: CreateTratamientoDto) {
    try {
      const nuevoTratamiento = this.tratamientosRepository.create({
        ...createTratamientoDto,
        id_epa: { id_epa: createTratamientoDto.id_epa }
      });
      return await this.tratamientosRepository.save(nuevoTratamiento);
    } catch (error) {
      throw new BadRequestException('Error al crear el tratamiento: ' + error.message);
    }
  }

  async findAll(epaId?: number, tipo?: string) {
    try {
      const qb = this.tratamientosRepository.createQueryBuilder('tratamiento')
        .leftJoinAndSelect('tratamiento.id_epa', 'epa')
        .select([
          'tratamiento.id_tratamiento', 
          'tratamiento.descripcion', 
          'tratamiento.dosis', 
          'tratamiento.frecuencia',
          'tratamiento.tipo',
          'epa.id_epa', 
          'epa.nombre_epa'
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
    try {
      const tratamiento = await this.tratamientosRepository.createQueryBuilder('tratamiento')
        .leftJoinAndSelect('tratamiento.id_epa', 'epa')
        .select([
          'tratamiento.id_tratamiento', 
          'tratamiento.descripcion', 
          'tratamiento.dosis', 
          'tratamiento.frecuencia',
          'epa.id_epa',
          'epa.nombre_epa'
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

  async findByEpaId(epaId: number) {
    return await this.tratamientosRepository.find({
      where: { id_epa: { id_epa: epaId } },
      relations: ['id_epa']
    });
  }

  async update(id_tratamiento: number, updateTratamientoDto: UpdateTratamientoDto) {
    const tratamiento = await this.findOne(id_tratamiento);
    
    if (!tratamiento) {
      throw new NotFoundException(`Tratamiento con ID ${id_tratamiento} no encontrado`);
    }
    
    const updateData: Partial<Tratamiento> = {};

    if (updateTratamientoDto.descripcion !== undefined) {
      updateData.descripcion = updateTratamientoDto.descripcion;
    }
    if (updateTratamientoDto.dosis !== undefined) {
      updateData.dosis = updateTratamientoDto.dosis;
    }
    if (updateTratamientoDto.frecuencia !== undefined) {
      updateData.frecuencia = updateTratamientoDto.frecuencia;
    }
    if (updateTratamientoDto.tipo !== undefined) {
      const t = updateTratamientoDto.tipo?.toString().trim();
      if (t === 'Biologico' || t === 'Quimico') {
        updateData.tipo = t as any;
      }
    }
    if (updateTratamientoDto.id_epa !== undefined) {
      const epaIdNum = Number(updateTratamientoDto.id_epa);
      if (!Number.isFinite(epaIdNum) || epaIdNum <= 0) {
        throw new BadRequestException('id_epa debe ser un entero válido');
      }
      const epa = await this.epaRepository.findOne({ where: { id_epa: epaIdNum } });
      if (!epa) {
        throw new NotFoundException(`EPA con ID ${epaIdNum} no encontrado`);
      }
      updateData.id_epa = epa as any;
    }

    Object.assign(tratamiento, updateData);
    return await this.tratamientosRepository.save(tratamiento);
  }

  async remove(id_tratamiento: number) {
    const tratamiento = await this.findOne(id_tratamiento);
    
    if (!tratamiento) {
      throw new NotFoundException(`Tratamiento con ID ${id_tratamiento} no encontrado`);
    }
    
    return await this.tratamientosRepository.delete(id_tratamiento);
  }
}
