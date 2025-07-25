import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { CreateSensoreDto } from './dto/create-sensore.dto';
import { UpdateSensoreDto } from './dto/update-sensore.dto';

@Injectable()
export class SensoresService {
  constructor(
    @InjectRepository(Sensor)
    private sensoresRepository: Repository<Sensor>,
  ) {}

  async create(createSensorDto: CreateSensoreDto) {
    const nuevoSensor = this.sensoresRepository.create(createSensorDto);
    return await this.sensoresRepository.save(nuevoSensor);
  }

  async findAll() {
    return await this.sensoresRepository.find();
  }

  async findOne(id_sensor: number) {
    return await this.sensoresRepository.findOneBy({ id_sensor });
  }

  async update(id_sensor: number, updateSensorDto: UpdateSensoreDto) {
    await this.sensoresRepository.update(id_sensor, updateSensorDto);
    return this.findOne(id_sensor);
  }

  async remove(id_sensor: number) {
    return await this.sensoresRepository.delete(id_sensor);
  }
}
