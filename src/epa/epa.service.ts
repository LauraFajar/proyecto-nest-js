import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epa } from './entities/epa.entity';
import { CreateEpaDto } from './dto/create-epa.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class EpaService {
  constructor(
    @InjectRepository(Epa)
    private epaRepository: Repository<Epa>,
  ) {}

  async create(createEpaDto: CreateEpaDto) {
    try {
      // Verificar si ya existe un EPA con el mismo nombre
      const existingEpa = await this.epaRepository.findOne({
        where: { nombre_epa: createEpaDto.nombre_epa, estado: 'activo' }
      });
      
      if (existingEpa) {
        throw new BadRequestException(`Ya existe un EPA con el nombre ${createEpaDto.nombre_epa}`);
      }
      
      const epa = this.epaRepository.create(createEpaDto);
      return await this.epaRepository.save(epa);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el EPA: ' + error.message);
    }
  }

  async findAll(paginationDto?: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      
      const [items, total] = await this.epaRepository.findAndCount({
        where: { estado: 'activo' },
        relations: ['tratamientos'],
        skip: (page - 1) * limit,
        take: limit,
      });
      
      return {
        items,
        meta: {
          totalItems: total,
          itemsPerPage: limit,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error en findAll de EPA:', error);
      return {
        items: await this.epaRepository.find({
          where: { estado: 'activo' }
        }),
        meta: {
          totalItems: 0,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 0
        }
      };
    }
  }

  async findOne(id: number) {
    const epa = await this.epaRepository.findOne({
      where: { id_epa: id, estado: 'activo' },
      relations: ['tratamientos']
    });
    
    if (!epa) {
      throw new NotFoundException('EPA no encontrado');
    }
    return epa;
  }

  async search(query: string, tipo?: string) {
    const queryBuilder = this.epaRepository
      .createQueryBuilder('epa')
      .where('epa.estado = :estado', { estado: 'activo' });
    
    if (query && query.trim() !== '') {
      queryBuilder.andWhere('(LOWER(epa.nombre_epa) LIKE LOWER(:query) OR LOWER(epa.descripcion) LIKE LOWER(:query))', 
        { query: `%${query}%` });
    }
    
    if (tipo && ['enfermedad', 'plaga', 'arvense'].includes(tipo)) {
      queryBuilder.andWhere('epa.tipo = :tipo', { tipo });
    }
    
    return await queryBuilder
      .leftJoinAndSelect('epa.tratamientos', 'tratamientos')
      .orderBy('epa.nombre_epa', 'ASC')
      .getMany();
  }

  async update(id: number, updateEpaDto: Partial<CreateEpaDto>) {
    const epa = await this.findOne(id);
    Object.assign(epa, updateEpaDto);
    return await this.epaRepository.save(epa);
  }

  async remove(id: number) {
    const epa = await this.findOne(id);
    epa.estado = 'inactivo';
    return await this.epaRepository.save(epa);
  }
}
