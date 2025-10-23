import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento)
    private tratamientosRepository: Repository<Tratamiento>,
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

  async findAll() {
    try {
      return await this.tratamientosRepository.createQueryBuilder('tratamiento')
        .leftJoinAndSelect('tratamiento.id_epa', 'epa')
        .select([
          'tratamiento.id_tratamiento', 
          'tratamiento.descripcion', 
          'tratamiento.dosis', 
          'tratamiento.frecuencia',
          'epa.id_epa', 
          'epa.nombre_epa'
        ])
        .getMany();
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
    
    Object.assign(tratamiento, updateTratamientoDto);
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
