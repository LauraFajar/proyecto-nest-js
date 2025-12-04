import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sensor } from '../../sensores/entities/sensor.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SensorSeeder {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Sublote)
    private readonly subloteRepository: Repository<Sublote>,
  ) {}

  async seed() {
    const sublote1 = await this.subloteRepository.findOne({ where: { id_sublote: 1 } });

    if (sublote1) {
      const data = [
        {
          tipo_sensor: 'Humedad del Suelo',
          valor_minimo: 20,
          valor_maximo: 60,
          valor_actual: 45,
          estado: 'Activo',
          id_sublote: sublote1,
          mqtt_topic: 'luixxa/dht11',
          mqtt_enabled: true,
        },
        {
          tipo_sensor: 'Temperatura Ambiente',
          valor_minimo: 18,
          valor_maximo: 30,
          valor_actual: 25,
          estado: 'Activo',
          id_sublote: sublote1,
          mqtt_topic: 'luixxa/dht11',
          mqtt_enabled: true,
        },
        {
          tipo_sensor: 'Humedad Ambiente',
          valor_minimo: 30,
          valor_maximo: 80,
          valor_actual: 50,
          estado: 'Activo',
          id_sublote: sublote1,
          mqtt_topic: 'luixxa/dht11',
          mqtt_enabled: true,
        },
      ];

      for (const item of data) {
        const exists = await this.sensorRepository.createQueryBuilder("sensor")
          .where("sensor.tipo_sensor = :tipo_sensor", { tipo_sensor: item.tipo_sensor })
          .andWhere("sensor.id_sublote = :subloteId", { subloteId: item.id_sublote.id_sublote })
          .getOne();

        if (!exists) {
          await this.sensorRepository.save(this.sensorRepository.create(item));
        } else {
          await this.sensorRepository.update(exists.id_sensor, {
            mqtt_topic: item.mqtt_topic,
            mqtt_enabled: item.mqtt_enabled,
          });
        }
      }
    }
  }
}