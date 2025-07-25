import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './entities/actividad.entity';
import { CreateActividadeDto } from './dto/create-actividade.dto';
import { UpdateActividadeDto } from './dto/update-actividade.dto';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private actividadesRepository: Repository<Actividad>,
  ) {}

  async create(createActividadDto: CreateActividadeDto) {
    const nuevaActividad = this.actividadesRepository.create(createActividadDto);
    return await this.actividadesRepository.save(nuevaActividad);
  }

  async findAll() {
    return await this.actividadesRepository.find();
  }

  async findOne(id_actividad: number) {
    return await this.actividadesRepository.findOneBy({ id_actividad });
  }

  async update(id_actividad: number, updateActividadDto: UpdateActividadeDto) {
    await this.actividadesRepository.update(id_actividad, updateActividadDto);
    return this.findOne(id_actividad);
  }

  async remove(id_actividad: number) {
    return await this.actividadesRepository.delete(id_actividad);
  }
}
