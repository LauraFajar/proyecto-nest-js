import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mqtt from 'mqtt';
import { Sensor } from '../entities/sensor.entity';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private clients: Map<number, mqtt.MqttClient> = new Map();

  constructor(
    @InjectRepository(Sensor)
    private readonly sensoresRepository: Repository<Sensor>,
  ) {}

  async onModuleInit() {
    // MQTT connections will be initialized on demand
    this.logger.log('MQTT service initialized - connections will be established on demand');
  }

  async onModuleDestroy() {
    // Close all MQTT connections
    for (const [sensorId, client] of this.clients) {
      client.end();
      this.logger.log(`Closed MQTT connection for sensor ${sensorId}`);
    }
  }

  private async initializeMqttConnections() {
    const sensores = await this.sensoresRepository.find({
      where: { mqtt_enabled: true },
    });

    for (const sensor of sensores) {
      if (sensor.mqtt_host && sensor.mqtt_port && sensor.mqtt_topic) {
        await this.connectSensor(sensor);
      }
    }
  }

  async connectSensor(sensor: Sensor): Promise<boolean> {
    try {
      if (!sensor.mqtt_host || !sensor.mqtt_port || !sensor.mqtt_topic) {
        this.logger.warn(`Sensor ${sensor.id_sensor} missing MQTT configuration`);
        return false;
      }

      // Close existing connection if any
      const existingClient = this.clients.get(sensor.id_sensor);
      if (existingClient) {
        existingClient.end();
        this.clients.delete(sensor.id_sensor);
      }

      const options: mqtt.IClientOptions = {
        host: sensor.mqtt_host,
        port: sensor.mqtt_port,
        protocol: 'mqtt',
        clientId: sensor.mqtt_client_id || `sensor_${sensor.id_sensor}_${Date.now()}`,
      };

      if (sensor.mqtt_username && sensor.mqtt_password) {
        options.username = sensor.mqtt_username;
        options.password = sensor.mqtt_password;
      }

      const client = mqtt.connect(options);

      client.on('connect', () => {
        this.logger.log(`Connected to MQTT broker for sensor ${sensor.id_sensor}`);
        client.subscribe(sensor.mqtt_topic, (err) => {
          if (err) {
            this.logger.error(`Failed to subscribe to topic ${sensor.mqtt_topic} for sensor ${sensor.id_sensor}`, err);
          } else {
            this.logger.log(`Subscribed to topic ${sensor.mqtt_topic} for sensor ${sensor.id_sensor}`);
          }
        });
      });

      client.on('message', async (topic, message) => {
        try {
          const payload = message.toString();
          this.logger.log(`Received message on topic ${topic} for sensor ${sensor.id_sensor}: ${payload}`);

          // Parse the message and update sensor reading
          const value = parseFloat(payload);
          if (!isNaN(value)) {
            await this.updateSensorReading(sensor.id_sensor, value);
          }
        } catch (error) {
          this.logger.error(`Error processing MQTT message for sensor ${sensor.id_sensor}`, error);
        }
      });

      client.on('error', (error) => {
        this.logger.error(`MQTT connection error for sensor ${sensor.id_sensor}`, error);
      });

      client.on('close', () => {
        this.logger.log(`MQTT connection closed for sensor ${sensor.id_sensor}`);
        this.clients.delete(sensor.id_sensor);
      });

      this.clients.set(sensor.id_sensor, client);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect sensor ${sensor.id_sensor} to MQTT`, error);
      return false;
    }
  }

  async disconnectSensor(sensorId: number): Promise<void> {
    const client = this.clients.get(sensorId);
    if (client) {
      client.end();
      this.clients.delete(sensorId);
      this.logger.log(`Disconnected MQTT client for sensor ${sensorId}`);
    }
  }

  async publishToSensor(sensorId: number, message: string): Promise<boolean> {
    const sensor = await this.sensoresRepository.findOne({ where: { id_sensor: sensorId } });
    if (!sensor || !sensor.mqtt_topic) {
      return false;
    }

    const client = this.clients.get(sensorId);
    if (!client || !client.connected) {
      return false;
    }

    return new Promise((resolve) => {
      client.publish(sensor.mqtt_topic, message, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to sensor ${sensorId}`, error);
          resolve(false);
        } else {
          this.logger.log(`Published message to sensor ${sensorId}: ${message}`);
          resolve(true);
        }
      });
    });
  }

  async updateSensorReading(sensorId: number, value: number): Promise<void> {
    try {
      await this.sensoresRepository.update(sensorId, {
        valor_actual: value,
        ultima_lectura: new Date(),
      });
      this.logger.log(`Updated sensor ${sensorId} with value ${value}`);
    } catch (error) {
      this.logger.error(`Failed to update sensor ${sensorId} reading`, error);
    }
  }

  async configureSensorMqtt(sensorId: number, config: {
    mqtt_host?: string;
    mqtt_port?: number;
    mqtt_topic?: string;
    mqtt_username?: string;
    mqtt_password?: string;
    mqtt_enabled?: boolean;
    mqtt_client_id?: string;
  }): Promise<boolean> {
    try {
      await this.sensoresRepository.update(sensorId, config);

      const sensor = await this.sensoresRepository.findOne({ where: { id_sensor: sensorId } });
      if (!sensor) {
        return false;
      }

      if (sensor.mqtt_enabled) {
        return await this.connectSensor(sensor);
      } else {
        await this.disconnectSensor(sensorId);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to configure MQTT for sensor ${sensorId}`, error);
      return false;
    }
  }

  getConnectedSensors(): number[] {
    return Array.from(this.clients.keys());
  }

  isSensorConnected(sensorId: number): boolean {
    const client = this.clients.get(sensorId);
    return client ? client.connected : false;
  }

  async initializeConnectionsOnDemand(): Promise<void> {
    try {
      await this.initializeMqttConnections();
      this.logger.log('MQTT connections initialized on demand');
    } catch (error) {
      this.logger.error('Failed to initialize MQTT connections on demand', error);
      throw error;
    }
  }
}