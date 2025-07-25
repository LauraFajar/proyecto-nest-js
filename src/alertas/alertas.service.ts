import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta } from './entities/alerta.entity';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta)
    private alertasRepository: Repository<Alerta>,
  ) {}

  async create(createAlertaDto: CreateAlertaDto) {
    const nuevaAlerta = this.alertasRepository.create(createAlertaDto);
    return await this.alertasRepository.save(nuevaAlerta);
  }

  async findAll() {
    return await this.alertasRepository.find();
  }

  async findOne(id_alerta: number) {
    return await this.alertasRepository.findOneBy({ id_alerta });
  }

  async update(id_alerta: number, updateAlertaDto: UpdateAlertaDto) {
    await this.alertasRepository.update(id_alerta, updateAlertaDto);
    return this.findOne(id_alerta);
  }

  async remove(id_alerta: number) {
    return await this.alertasRepository.delete(id_alerta);
  }
}
