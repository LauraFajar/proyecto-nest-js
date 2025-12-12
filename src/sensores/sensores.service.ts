import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { Lectura } from './entities/lectura.entity';
import { MqttService } from './services/mqtt.service';

@Injectable()
export class SensoresService {
  private readonly logger = new Logger(SensoresService.name);

  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Lectura)
    private readonly lecturaRepository: Repository<Lectura>,
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
  ) {}

  async actualizarLecturaPorTopic(
    topic: string,
    valor: number,
    metric: string,
  ): Promise<void> {
    try {
      const sensor = await this.sensorRepository.findOne({
        where: { mqtt_topic: topic }
      });

      if (!sensor) {
        this.logger.warn(`Sensor con topic ${topic} no encontrado, creando registro temporal`);
        const nuevoSensor = this.sensorRepository.create({
          tipo_sensor: metric,
          mqtt_topic: topic,
          estado: 'activo',
          valor_actual: valor,
          ultima_lectura: new Date(),
          valor_minimo: valor,
          valor_maximo: valor,
          historial_lecturas: [{ valor, timestamp: new Date(), unidad_medida: metric, observaciones: 'Lectura MQTT' }]
        });
        await this.sensorRepository.save(nuevoSensor);
        await this.registrarLecturaPorTopic(nuevoSensor, topic, valor, new Date(), metric); // Pasar el nuevoSensor
        return;
      }

      const historial = Array.isArray(sensor.historial_lecturas)
        ? sensor.historial_lecturas
        : [];

      historial.push({ valor, timestamp: new Date(), unidad_medida: metric, observaciones: 'Lectura MQTT' });
      if (historial.length > 100) {
        historial.shift();
      }

      // Actualizar valores
      await this.sensorRepository.update({ id_sensor: sensor.id_sensor }, {
        valor_actual: valor as any,
        ultima_lectura: new Date(),
        valor_minimo: Math.min(sensor.valor_minimo || valor, valor),
        valor_maximo: Math.max(sensor.valor_maximo || valor, valor),
        historial_lecturas: historial as any,
      });

      await this.registrarLecturaPorTopic(sensor, topic, valor, new Date(), metric); 

      this.logger.log(`Lectura actualizada para sensor ${sensor.id_sensor} (${metric}): ${valor}`);
    } catch (error) {
      this.logger.error(`Error actualizando lectura para topic ${topic}:`, error);
    }
  }

  async findAll(): Promise<Sensor[]> {
    try {
      if (!this.sensorRepository || !this.sensorRepository.manager?.connection?.isConnected) {
        this.logger.warn('Database not connected, returning empty array');
        return [];
      }

      try {
        this.sensorRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(`Entity metadata not loaded for Sensor: ${metadataError.message}. Returning empty array.`);
        return [];
      }
      
      return await this.sensorRepository.find();
    } catch (error) {
      if (error instanceof Error && error.message.includes('No metadata for "Sensor" was found')) {
        this.logger.error(`Entity "Sensor" not found in TypeORM metadata. This may indicate a configuration issue.`, error);
      } else {
        this.logger.error(`Error in findAll():`, error);
      }
      return [];
    }
  }

  async findOne(id_sensor: number): Promise<Sensor | null> {
    return this.sensorRepository.findOne({ where: { id_sensor } });
  }

  async update(id_sensor: number, data: Partial<Sensor>): Promise<Sensor | null> {
    await this.sensorRepository.update({ id_sensor }, data);
    return this.findOne(id_sensor);
  }

  async obtenerLecturasDeSensor(id_sensor: number): Promise<Lectura[]> {
    return this.lecturaRepository.find({
      where: { sensor: { id_sensor } },
      order: { fecha: 'DESC' },
    });
  }

  async registrarLecturaPorTopic(
    sensor: Sensor, 
    topic: string,
    valor: number,
    fecha?: Date,
    metric?: string,
  ): Promise<Lectura | null> {
    try {
      if (!this.lecturaRepository || !this.lecturaRepository.manager?.connection?.isConnected) {
        this.logger.warn('Database not connected, skipping lecture save');
        return null;
      }

      try {
        this.lecturaRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(`Entity metadata not loaded for Lectura: ${metadataError.message}. Skipping save.`);
        return null;
      }
      
      const lectura = this.lecturaRepository.create({
        sensor: sensor, 
        mqtt_topic: topic,
        valor,
        fecha: fecha ?? new Date(),
        unidad_medida: metric,
      });
      return await this.lecturaRepository.save(lectura);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No metadata for "Lectura" was found')) {
        this.logger.warn(`Entity "Lectura" not found in TypeORM metadata. This may indicate a configuration issue.`, error);
      } else {
        this.logger.error(`Error saving lecture for topic ${topic}:`, error);
      }
      return null;
    }
  }

  async updateSensorReading(id_sensor: number, valor: number): Promise<void> {
    const sensor = await this.findOne(id_sensor);
    if (!sensor) return;

    const historial = Array.isArray(sensor.historial_lecturas)
      ? sensor.historial_lecturas
      : [];

    historial.push({ valor, timestamp: new Date() });

    await this.sensorRepository.update({ id_sensor }, {
      valor_actual: valor as any,
      ultima_lectura: new Date(),
      historial_lecturas: historial as any,
    });
  }

  async inicializarConexionesMqtt(): Promise<void> {
    const sensores = await this.sensorRepository.find();
    for (const sensor of sensores) {
      if (sensor.mqtt_enabled && sensor.mqtt_topic) {
        try {
          if (typeof (this.mqttService as any).subscribe === 'function') {
            (this.mqttService as any).subscribe(sensor);
          }
        } catch (e) {
        }
      }
    }
  }

  async listTopics(): Promise<string[]> {
    const rows = await this.sensorRepository
      .createQueryBuilder('s')
      .select('DISTINCT s.mqtt_topic', 'mqtt_topic')
      .where('s.mqtt_topic IS NOT NULL')
      .andWhere("s.mqtt_topic <> ''")
      .getRawMany();
    return rows.map((r: any) => r.mqtt_topic);
  }
}
