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

  // ---------------------------------------------------------
  // CRUD Básico de Sensores
  // ---------------------------------------------------------
  async findAll(): Promise<Sensor[]> {
    try {
      // Check if repository is properly initialized
      if (!this.sensorRepository || !this.sensorRepository.manager?.connection?.isConnected) {
        this.logger.warn('Database not connected, returning empty array');
        return [];
      }

      // Check if entity metadata is loaded
      try {
        // This will throw if metadata is not found
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

  // ---------------------------------------------------------
  // Lecturas por Sensor / Topic
  // ---------------------------------------------------------
  async obtenerLecturasDeSensor(id_sensor: number): Promise<Lectura[]> {
    return this.lecturaRepository.find({
      where: { sensor: { id_sensor } },
      order: { fecha: 'DESC' },
    });
  }

  async registrarLecturaPorTopic(
    topic: string,
    valor: number,
    fecha?: Date,
    metric?: string,
  ): Promise<Lectura | null> {
    try {
      // Check if repository is properly initialized with metadata
      if (!this.lecturaRepository || !this.lecturaRepository.manager?.connection?.isConnected) {
        this.logger.warn('Database not connected, skipping lecture save');
        return null;
      }

      // Check if entity metadata is loaded
      try {
        // This will throw if metadata is not found
        this.lecturaRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(`Entity metadata not loaded for Lectura: ${metadataError.message}. Skipping save.`);
        return null;
      }
      
      const lectura = this.lecturaRepository.create({
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

  // ---------------------------------------------------------
  // Inicialización de conexiones MQTT (suscripción por sensores activos)
  // ---------------------------------------------------------
  async inicializarConexionesMqtt(): Promise<void> {
    const sensores = await this.sensorRepository.find();
    for (const sensor of sensores) {
      if (sensor.mqtt_enabled && sensor.mqtt_topic) {
        try {
          // Suscribir usando el servicio MQTT
          if (typeof (this.mqttService as any).subscribe === 'function') {
            (this.mqttService as any).subscribe(sensor);
          }
        } catch (e) {
          // Continuar con otros sensores aún si falla uno
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
