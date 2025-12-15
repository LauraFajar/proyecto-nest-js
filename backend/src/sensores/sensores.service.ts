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
        where: { mqtt_topic: topic },
      });

      if (!sensor) {
        this.logger.warn(
          `Sensor con topic ${topic} no encontrado, creando registro temporal`,
        );
        const nuevoSensor = this.sensorRepository.create({
          tipo_sensor: metric,
          mqtt_topic: topic,
          estado: 'activo',
          valor_actual: valor,
          ultima_lectura: new Date(),
          valor_minimo: valor,
          valor_maximo: valor,
          historial_lecturas: [
            {
              valor,
              timestamp: new Date(),
              unidad_medida: metric,
              observaciones: 'Lectura MQTT',
            },
          ],
        });
        await this.sensorRepository.save(nuevoSensor);
        await this.registrarLecturaPorTopic(
          nuevoSensor,
          topic,
          valor,
          new Date(),
          metric,
        ); // Pasar el nuevoSensor
        return;
      }

      const historial = Array.isArray(sensor.historial_lecturas)
        ? sensor.historial_lecturas
        : [];

      historial.push({
        valor,
        timestamp: new Date(),
        unidad_medida: metric,
        observaciones: 'Lectura MQTT',
      });
      if (historial.length > 100) {
        historial.shift();
      }

      // Actualizar valores
      await this.sensorRepository.update(
        { id_sensor: sensor.id_sensor },
        {
          valor_actual: valor as any,
          ultima_lectura: new Date(),
          valor_minimo: Math.min(sensor.valor_minimo || valor, valor),
          valor_maximo: Math.max(sensor.valor_maximo || valor, valor),
          historial_lecturas: historial as any,
        },
      );

      await this.registrarLecturaPorTopic(
        sensor,
        topic,
        valor,
        new Date(),
        metric,
      );

      this.logger.log(
        `Lectura actualizada para sensor ${sensor.id_sensor} (${metric}): ${valor}`,
      );
    } catch (error) {
      this.logger.error(
        `Error actualizando lectura para topic ${topic}:`,
        error,
      );
    }
  }

  async findAll(): Promise<Sensor[]> {
    try {
      if (
        !this.sensorRepository ||
        !this.sensorRepository.manager?.connection?.isConnected
      ) {
        this.logger.warn('Database not connected, returning empty array');
        return [];
      }

      try {
        this.sensorRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(
          `Entity metadata not loaded for Sensor: ${metadataError.message}. Returning empty array.`,
        );
        return [];
      }

      return await this.sensorRepository.find();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('No metadata for "Sensor" was found')
      ) {
        this.logger.error(
          `Entity "Sensor" not found in TypeORM metadata. This may indicate a configuration issue.`,
          error,
        );
      } else {
        this.logger.error(`Error in findAll():`, error);
      }
      return [];
    }
  }

  async findOne(id_sensor: number): Promise<Sensor | null> {
    return this.sensorRepository.findOne({ where: { id_sensor } });
  }

  async update(
    id_sensor: number,
    data: Partial<Sensor>,
  ): Promise<Sensor | null> {
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
      if (
        !this.lecturaRepository ||
        !this.lecturaRepository.manager?.connection?.isConnected
      ) {
        this.logger.warn('Database not connected, skipping lecture save');
        return null;
      }

      try {
        this.lecturaRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(
          `Entity metadata not loaded for Lectura: ${metadataError.message}. Skipping save.`,
        );
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
      if (
        error instanceof Error &&
        error.message.includes('No metadata for "Lectura" was found')
      ) {
        this.logger.warn(
          `Entity "Lectura" not found in TypeORM metadata. This may indicate a configuration issue.`,
          error,
        );
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

    await this.sensorRepository.update(
      { id_sensor },
      {
        valor_actual: valor as any,
        ultima_lectura: new Date(),
        historial_lecturas: historial as any,
      },
    );
  }

  async inicializarConexionesMqtt(): Promise<void> {
    const sensores = await this.sensorRepository.find();
    for (const sensor of sensores) {
      if (sensor.mqtt_enabled && sensor.mqtt_topic) {
        try {
          if (typeof (this.mqttService as any).subscribe === 'function') {
            (this.mqttService as any).subscribe(sensor);
          }
        } catch (e) {}
      }
    }
  }

  async handleSensorControlCommand(device: string, sensorName: string, action: 'ON' | 'OFF'): Promise<void> {
    const fullTopic = `luixxa/${device}`; 
    const targetStatus = action === 'OFF' ? 'inactivo' : 'activo';

    const sensor = await this.sensorRepository.findOne({
      where: {
        mqtt_topic: fullTopic,
        tipo_sensor: sensorName,
      },
    });

    if (!sensor) {
      this.logger.warn(`Sensor para device '${device}' y tipo '${sensorName}' no encontrado para la acción '${action}'.`);
      return;
    }
    await this.sensorRepository.update(sensor.id_sensor, { estado: targetStatus });
    this.logger.log(`Sensor '${sensor.id_sensor}' (${sensor.mqtt_topic}, ${sensor.tipo_sensor}) actualizado a estado '${targetStatus}' por comando MQTT.`);
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

  async procesarDatosArduino(datosArduino: {
    temperatura: number;
    humedad_aire: number;
    humedad_suelo_adc: number;
  }): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Procesar cada sensor del JSON
      await Promise.all([
        this.actualizarSensorPorTipo('temperatura', datosArduino.temperatura, timestamp),
        this.actualizarSensorPorTipo('humedad_aire', datosArduino.humedad_aire, timestamp),
        this.actualizarSensorPorTipo('humedad_suelo_adc', datosArduino.humedad_suelo_adc, timestamp)
      ]);

      this.logger.log(`Datos de Arduino procesados: temperatura=${datosArduino.temperatura}, humedad_aire=${datosArduino.humedad_aire}, humedad_suelo_adc=${datosArduino.humedad_suelo_adc}`);
    } catch (error) {
      this.logger.error('Error procesando datos del Arduino:', error);
      throw error;
    }
  }

  private async actualizarSensorPorTipo(tipoSensor: string, valor: number, timestamp: Date): Promise<void> {
    // Validar rangos según el tipo de sensor
    if (!this.validarRangoSensor(tipoSensor, valor)) {
      this.logger.warn(`Valor fuera de rango para ${tipoSensor}: ${valor}`);
      return;
    }

    // Buscar sensor existente por tipo
    let sensor = await this.sensorRepository.findOne({
      where: { tipo_sensor: tipoSensor }
    });

    // Si no existe, crearlo
    if (!sensor) {
      sensor = this.sensorRepository.create({
        tipo_sensor: tipoSensor,
        valor_actual: valor,
        valor_minimo: valor,
        valor_maximo: valor,
        ultima_lectura: timestamp,
        estado: 'activo',
        historial_lecturas: [
          {
            valor,
            timestamp,
            unidad_medida: this.obtenerUnidadMedida(tipoSensor),
            observaciones: 'Lectura Arduino'
          }
        ]
      });
      await this.sensorRepository.save(sensor);
      
      // Registrar lectura en tabla separada
      await this.registrarLecturaPorTipo(sensor, valor, timestamp);
      
      this.logger.log(`Sensor ${tipoSensor} creado con valor inicial: ${valor}`);
      return;
    }

    // Actualizar sensor existente
    const historial = Array.isArray(sensor.historial_lecturas) ? sensor.historial_lecturas : [];
    
    // Agregar nueva lectura al historial
    historial.push({
      valor,
      timestamp,
      unidad_medida: this.obtenerUnidadMedida(tipoSensor),
      observaciones: 'Lectura Arduino'
    });

    // Mantener límite de 100 registros
    if (historial.length > 100) {
      historial.shift();
    }

    // Actualizar valores en la base de datos
    await this.sensorRepository.update(
      { id_sensor: sensor.id_sensor },
      {
        valor_actual: valor as any,
        ultima_lectura: timestamp,
        valor_minimo: Math.min(sensor.valor_minimo || valor, valor),
        valor_maximo: Math.max(sensor.valor_maximo || valor, valor),
        historial_lecturas: historial as any,
      }
    );

    // Registrar lectura en tabla separada
    await this.registrarLecturaPorTipo(sensor, valor, timestamp);

    this.logger.log(`Sensor ${tipoSensor} actualizado: ${valor}`);
  }

  private validarRangoSensor(tipoSensor: string, valor: number): boolean {
    switch (tipoSensor) {
      case 'temperatura':
        return valor >= -50 && valor <= 100; // °C
      case 'humedad_aire':
        return valor >= 0 && valor <= 100; // %
      case 'humedad_suelo_adc':
        return valor >= 0 && valor <= 4095; // ADC
      default:
        return true; // Sin validación para tipos desconocidos
    }
  }

  private obtenerUnidadMedida(tipoSensor: string): string {
    switch (tipoSensor) {
      case 'temperatura':
        return '°C';
      case 'humedad_aire':
        return '%';
      case 'humedad_suelo_adc':
        return 'ADC';
      default:
        return 'un';
    }
  }

  private async registrarLecturaPorTipo(sensor: Sensor, valor: number, fecha: Date): Promise<Lectura | null> {
    try {
      if (!this.lecturaRepository || !this.lecturaRepository.manager?.connection?.isConnected) {
        this.logger.warn('Database not connected, skipping lecture save');
        return null;
      }

      try {
        this.lecturaRepository.metadata;
      } catch (metadataError) {
        this.logger.warn(
          `Entity metadata not loaded for Lectura: ${metadataError.message}. Skipping save.`
        );
        return null;
      }

      const lectura = this.lecturaRepository.create({
        sensor: sensor,
        valor,
        fecha: fecha,
        unidad_medida: this.obtenerUnidadMedida(sensor.tipo_sensor),
      });
      return await this.lecturaRepository.save(lectura);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('No metadata for "Lectura" was found')
      ) {
        this.logger.warn(
          `Entity "Lectura" not found in TypeORM metadata. This may indicate a configuration issue.`,
          error,
        );
      } else {
        this.logger.error(`Error saving lecture for sensor ${sensor.tipo_sensor}:`, error);
      }
      return null;
    }
  }
}
