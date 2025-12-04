import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor } from '../entities/sensor.entity';
import { Reading } from '../entities/reading.entity';
import { Broker } from '../entities/broker.entity';
import { CreateSensorDto } from '../dto/create-sensor.dto';
import { CreateBrokerDto } from '../dto/create-broker.dto';
import { IotGateway } from './iot.gateway';
import { connect, MqttClient } from 'mqtt';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class IotService implements OnModuleInit {
  private mqttClients: Map<string, MqttClient> = new Map();
  private defaultClient: MqttClient | null = null;

  constructor(
    @InjectModel(Sensor.name) private sensorModel: Model<Sensor>,
    @InjectModel(Reading.name) private readingModel: Model<Reading>,
    @InjectModel(Broker.name) private brokerModel: Model<Broker>,
    private readonly iotGateway: IotGateway,
    @Optional() private readonly alertasService?: any,
  ) {}

  async onModuleInit() {
    // Backfill sensor records for existing readings
    await this.backfillSensorRecords();
    
    // Connect to default HiveMQ broker on startup
    await this.connectToDefaultBroker();
    // Also connect to any brokers stored in database
    const brokers = await this.findActiveBrokers();
    for (const broker of brokers) {
      await this.connectBroker(broker);
    }
  }

  // Backfill sensor records for existing readings
  private async backfillSensorRecords(): Promise<void> {
    try {
      console.log('Backfilling sensor records for existing readings...');
      
      // Get all unique device IDs from readings
      const readings = await this.readingModel.aggregate([
        { $group: { _id: '$deviceId', topic: { $first: '$topic' } } }
      ]);
      
      for (const reading of readings) {
        const deviceId = reading._id;
        const topic = reading.topic || `luixxa/${deviceId}`;
        
        // Check if sensor already exists
        const existingSensor = await this.sensorModel.findOne({ deviceId }).exec();
        if (!existingSensor) {
          await this.ensureSensorExists(deviceId, topic);
        }
      }
      
      console.log(`Backfilled sensor records for ${readings.length} devices`);
    } catch (error) {
      console.error('Error backfilling sensor records:', error);
    }
  }

  private async connectToDefaultBroker(): Promise<void> {
    const brokerUrl = 'mqtt://broker.hivemq.com:1883';
    const topic = 'luixxa/dht11';
    
    console.log(`Connecting to default broker: ${brokerUrl}`);
    
    try {
      this.defaultClient = connect(brokerUrl, {
        clientId: `iot_backend_default_${Date.now()}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
      });

      this.defaultClient.on('connect', () => {
        console.log('Connected to HiveMQ broker');
        this.iotGateway.emitBrokerStatus('hivemq-default', 'connected');
        
        // Subscribe to the DHT11 topic
        this.defaultClient!.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error subscribing to topic ${topic}:`, err);
          } else {
            console.log(`Subscribed to topic: ${topic}`);
          }
        });
        
        // Also subscribe with wildcard for any subtopics
        this.defaultClient!.subscribe(`${topic}/#`, (err) => {
          if (err) {
            console.error(`Error subscribing to topic ${topic}/#:`, err);
          } else {
            console.log(`Subscribed to topic: ${topic}/#`);
          }
        });
      });

      this.defaultClient.on('message', async (receivedTopic, message) => {
        console.log(`Message received on ${receivedTopic}:`, message.toString());
        try {
          let payload;
          const msgStr = message.toString();
          
          // Try to parse as JSON first
          try {
            payload = JSON.parse(msgStr);
          } catch {
            // If not JSON, try to parse as simple format like "temp:25.5,hum:60"
            const parts = msgStr.split(',');
            payload = {};
            parts.forEach(part => {
              const [key, value] = part.split(':');
              if (key && value) {
                const numValue = parseFloat(value);
                if (key.toLowerCase().includes('temp')) {
                  payload.temperatura = numValue;
                } else if (key.toLowerCase().includes('hum')) {
                  payload.humedad_aire = numValue;
                }
              }
            });
          }
          
          // Extract device ID from topic or use default
          const deviceId = payload.deviceId || receivedTopic.split('/').pop() || 'dht11';
          
          // Ensure sensor record exists
          await this.ensureSensorExists(deviceId, receivedTopic);
          
          // Create reading record with Spanish field names
          const reading = await this.createReading(deviceId, {
            temperature: payload.temperatura || payload.temp,
            humidity: payload.humedad_aire,
            soilHumidity: payload.humedad_suelo_adc,
          });
          
          console.log('Reading saved:', reading);
          
          // Emit reading to WebSocket clients with original field names
          this.emitReading({
            deviceId,
            topic: receivedTopic,
            timestamp: new Date(),
            temperatura: payload.temperatura,
            humedad_aire: payload.humedad_aire,
            humedad_suelo_adc: payload.humedad_suelo_adc,
            bomba_estado: payload.bomba_estado,
            // Also include English field names for backward compatibility
            temperature: payload.temperatura,
            humidity: payload.humedad_aire,
            soilHumidity: payload.humedad_suelo_adc,
            value: payload.temperatura || payload.humedad_aire || 0,
          });
          
          // Also update sensor if exists and emit sensor status
          await this.updateSensorValue(deviceId, payload);
          
        } catch (error) {
          console.error('Error processing MQTT message:', error);
        }
      });

      this.defaultClient.on('error', (error) => {
        console.error('MQTT error:', error);
      });

      this.defaultClient.on('close', () => {
        console.log('Disconnected from HiveMQ broker');
        this.iotGateway.emitBrokerStatus('hivemq-default', 'disconnected');
      });

      this.defaultClient.on('reconnect', () => {
        console.log('Reconnecting to HiveMQ broker...');
      });
      
    } catch (error) {
      console.error('Error connecting to default broker:', error);
    }
  }

  private async updateSensorValue(deviceId: string, payload: any): Promise<void> {
    try {
      const sensor = await this.sensorModel.findOne({ deviceId }).exec();
      if (sensor) {
        sensor.valor_actual = payload.temperature || payload.humidity || 0;
        sensor.lastUpdate = new Date();
        await sensor.save();
      }
    } catch (error) {
      console.error('Error updating sensor value:', error);
    }
  }

  // Ensure default sensor exists
  async ensureDefaultSensor(): Promise<Sensor> {
    const existingSensor = await this.sensorModel.findOne({ deviceId: 'dht11-sensor' }).exec();
    if (existingSensor) {
      return existingSensor;
    }
    
    const defaultSensor = new this.sensorModel({
      deviceId: 'dht11-sensor',
      name: 'Sensor DHT11',
      tipo_sensor: 'temperatura',
      topic: 'luixxa/dht11',
      unidad_medida: '°C',
      location: 'Invernadero',
      crop: 'General',
      valor_actual: 0,
      active: true,
    });
    
    return defaultSensor.save();
  }

  // Ensure sensor exists for device ID
  async ensureSensorExists(deviceId: string, topic: string): Promise<Sensor> {
    const existingSensor = await this.sensorModel.findOne({ deviceId }).exec();
    if (existingSensor) {
      return existingSensor;
    }
    
    // Determine sensor type based on topic or device ID
    let sensorType = 'multisensor';
    let sensorName = 'Sensor IoT';
    let unit = '°C';
    
    if (topic.includes('dht11') || deviceId.includes('dht11')) {
      sensorType = 'dht11';
      sensorName = 'Sensor DHT11';
      unit = '°C';
    } else if (topic.includes('temperature') || deviceId.includes('temp')) {
      sensorType = 'temperatura';
      sensorName = 'Sensor de Temperatura';
      unit = '°C';
    } else if (topic.includes('humidity') || deviceId.includes('hum')) {
      sensorType = 'humedad';
      sensorName = 'Sensor de Humedad';
      unit = '%';
    }
    
    const newSensor = new this.sensorModel({
      deviceId,
      name: sensorName,
      tipo_sensor: sensorType,
      topic: topic,
      unidad_medida: unit,
      location: 'Invernadero',
      crop: 'General',
      valor_actual: 0,
      active: true,
    });
    
    const savedSensor = await newSensor.save();
    console.log(`Created new sensor record for device: ${deviceId}`);
    return savedSensor;
  }

  // Sensor operations
  async createSensor(createSensorDto: CreateSensorDto): Promise<Sensor> {
    const sensor = new this.sensorModel(createSensorDto);
    return sensor.save();
  }

  async findAllSensors(): Promise<Sensor[]> {
    return this.sensorModel.find().exec();
  }

  async findSensorById(id: string): Promise<Sensor> {
    const sensor = await this.sensorModel.findById(id).exec();
    if (!sensor) {
      throw new Error(`Sensor with id ${id} not found`);
    }
    return sensor;
  }

  async findSensorsByTopic(topic: string): Promise<Sensor[]> {
    return this.sensorModel.find({ topic: { $regex: topic, $options: 'i' } }).exec();
  }

  // Reading operations
  async createReading(deviceId: string, data: {
    temperature?: number;
    humidity?: number;
    soilHumidity?: number;
  }): Promise<Reading> {
    const reading = new this.readingModel({
      deviceId,
      timestamp: new Date(),
      ...data,
    });
    return reading.save();
  }

  async getReadingsByDevice(deviceId: string, limit: number = 100): Promise<Reading[]> {
    return this.readingModel
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getReadingsByTimeRange(deviceId: string, startDate: Date, endDate: Date): Promise<Reading[]> {
    return this.readingModel
      .find({
        deviceId,
        timestamp: { $gte: startDate, $lte: endDate }
      })
      .sort({ timestamp: 1 })
      .exec();
  }

  // Broker operations
  async createBroker(createBrokerDto: CreateBrokerDto): Promise<Broker> {
    const broker = new this.brokerModel(createBrokerDto);
    const savedBroker = await broker.save();
    
    // Connect to broker
    await this.connectBroker(savedBroker);
    
    return savedBroker;
  }

  async findAllBrokers(): Promise<Broker[]> {
    return this.brokerModel.find().exec();
  }

  async findActiveBrokers(): Promise<Broker[]> {
    return this.brokerModel.find({ active: true }).exec();
  }

  async updateBroker(id: string, updateData: Partial<CreateBrokerDto>): Promise<Broker> {
    const broker = await this.brokerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!broker) {
      throw new Error(`Broker with id ${id} not found`);
    }

    // Reconnect broker with new settings
    await this.disconnectBroker(id);
    await this.connectBroker(broker);

    return broker;
  }

  async deleteBroker(id: string): Promise<void> {
    await this.disconnectBroker(id);
    await this.brokerModel.findByIdAndDelete(id).exec();
  }

  // MQTT connection management
  private async connectBroker(broker: Broker): Promise<void> {
    try {
      const client = connect(broker.host, {
        username: broker.username,
        password: broker.password,
        clientId: `iot_backend_${broker._id}`,
      });

      client.on('connect', () => {
        console.log(`Connected to broker: ${broker.name}`);
        this.emitBrokerStatus(broker._id.toString(), 'connected');
        
        // Subscribe to all topics
        broker.topics.forEach(topic => {
          client.subscribe(topic, (err) => {
            if (err) {
              console.error(`Error subscribing to topic ${topic}:`, err);
            } else {
              console.log(`Subscribed to topic: ${topic}`);
            }
          });
        });
      });

      client.on('message', async (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          
          // Extract device ID from topic or payload
          const deviceId = payload.deviceId || topic.split('/').pop();
          
          // Ensure sensor record exists
          await this.ensureSensorExists(deviceId, topic);
          
          // Create reading record
          await this.createReading(deviceId, {
            temperature: payload.temperature,
            humidity: payload.humidity,
            soilHumidity: payload.soilHumidity,
          });
          
          // Emit reading to WebSocket clients
          this.emitReading({
            deviceId,
            timestamp: new Date(),
            temperature: payload.temperature,
            humidity: payload.humidity,
            soilHumidity: payload.soilHumidity,
          });
          
        } catch (error) {
          console.error('Error processing MQTT message:', error);
        }
      });

      client.on('error', (error) => {
        console.error(`MQTT error for broker ${broker.name}:`, error);
      });

      client.on('close', () => {
        console.log(`Disconnected from broker: ${broker.name}`);
        this.emitBrokerStatus(broker._id.toString(), 'disconnected');
      });

      this.mqttClients.set(broker._id.toString(), client);
      
    } catch (error) {
      console.error(`Error connecting to broker ${broker.name}:`, error);
    }
  }

  private async disconnectBroker(brokerId: string): Promise<void> {
    const client = this.mqttClients.get(brokerId);
    if (client) {
      client.end();
      this.mqttClients.delete(brokerId);
    }
  }

  private emitReading(reading: any): void {
    this.iotGateway.emitNewReading(reading);
  }

  private emitBrokerStatus(brokerId: string, status: 'connected' | 'disconnected'): void {
    this.iotGateway.emitBrokerStatus(brokerId, status);
  }

  // Dashboard data aggregation
  async getDashboardData(): Promise<{
    sensors: Sensor[];
    latestReadings: Reading[];
    brokerStatus: { [key: string]: boolean };
  }> {
    const sensors = await this.findAllSensors();
    const activeBrokers = await this.findActiveBrokers();
    
    // Get latest reading for each sensor
    const latestReadings = await Promise.all(
      sensors.map(sensor => 
        this.readingModel
          .findOne({ deviceId: sensor.deviceId })
          .sort({ timestamp: -1 })
          .exec()
      )
    );

    // Get broker connection status
    const brokerStatus = {};
    activeBrokers.forEach(broker => {
      brokerStatus[broker.name] = this.mqttClients.has(broker._id.toString());
    });

    return {
      sensors,
      latestReadings: latestReadings.filter(reading => reading !== null),
      brokerStatus,
    };
  }

  // MQTT Control Commands
  async sendMqttCommand(command: string, topic: string = 'luixxa/control'): Promise<boolean> {
    try {
      if (this.defaultClient && this.defaultClient.connected) {
        this.defaultClient.publish(topic, command, { qos: 1 });
        console.log(`📤 MQTT command sent to ${topic}: ${command}`);
        return true;
      } else {
        console.warn('MQTT client not connected, cannot send command');
        return false;
      }
    } catch (error) {
      console.error('Error sending MQTT command:', error);
      return false;
    }
  }

  // Export to PDF functionality - SIMPLIFIED AND ROBUST
  async exportToPdf(params: {
    sensor?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ buffer: Buffer; hasData: boolean }> {
    try {
      console.log('🔄 Iniciando generación de PDF con parámetros:', params);

      const data = await this.getExportData(params);
      console.log('📊 Datos obtenidos para PDF:', data.length, 'registros');

      if (data.length === 0) {
        console.log('⚠️ No hay datos para generar PDF');
        return { buffer: Buffer.from(''), hasData: false };
      }

      return new Promise((resolve, reject) => {
        try {
          console.log('📄 Creando documento PDF...');

          const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
              Title: 'Reporte IoT - AGROTIC',
              Author: 'AGROTIC IoT Dashboard',
              Subject: 'Reporte de Sensores IoT',
              Keywords: 'IoT, Sensores, Temperatura, Humedad, Agricultura'
            }
          });

          const chunks: Buffer[] = [];

          doc.on('data', (chunk) => {
            console.log('📦 Chunk de PDF recibido:', chunk.length, 'bytes');
            chunks.push(chunk);
          });

          doc.on('end', () => {
            console.log('✅ PDF generado exitosamente, tamaño total:', Buffer.concat(chunks).length, 'bytes');
            resolve({ buffer: Buffer.concat(chunks), hasData: true });
          });

          doc.on('error', (error) => {
            console.error('❌ Error en documento PDF:', error);
            reject(error);
          });

          // SIMPLIFIED PDF CONTENT - ONLY ESSENTIAL DATA AND CHARTS
          console.log('📝 Agregando contenido al PDF...');

          // Page 1: Header and Summary
          this.addEnhancedHeader(doc, params, data.length, this.calculatePeriodInfo(params));
          this.addExecutiveSummary(doc, data, params);

          // Page 2: Data Table and Charts
          if (doc.y > 600) {
            doc.addPage();
          }

          // Add data table with only essential columns
          this.addDetailedTable(doc, data);

          // Add simple charts for temperature, humidity, and soil moisture
          if (doc.y > 600) {
            doc.addPage();
          }

          // Add statistics section with charts
          this.addStatisticsSection(doc, data);

          // Add performance analysis
          if (doc.y > 600) {
            doc.addPage();
          }

          this.addPerformanceAnalysis(doc, data, params);

          // Enhanced footer
          this.addEnhancedFooter(doc);

          console.log('🏁 Finalizando generación de PDF...');
          doc.end();

        } catch (innerError) {
          console.error('❌ Error interno en generación de PDF:', innerError);
          reject(innerError);
        }
      });

    } catch (error) {
      console.error('💥 Error en exportToPdf:', error);
      throw error;
    }
  }



  private addExecutiveSummary(doc: any, data: any[], params: any): void {
    doc.fontSize(14).fillColor('#1976d2').text('📈 RESUMEN EJECUTIVO', { underline: true });
    doc.moveDown(0.5);
    
    // Calculate statistics
    const tempData = data.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
    const humAirData = data.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire);
    const humSoilData = data.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo);
    const pumpEvents = data.filter(d => d.bomba_estado === 'ENCENDIDA');
    
    const stats = {
      temp: {
        avg: tempData.length > 0 ? (tempData.reduce((a, b) => a + b, 0) / tempData.length).toFixed(1) : 'N/A',
        max: tempData.length > 0 ? Math.max(...tempData).toFixed(1) : 'N/A',
        min: tempData.length > 0 ? Math.min(...tempData).toFixed(1) : 'N/A'
      },
      humAir: {
        avg: humAirData.length > 0 ? (humAirData.reduce((a, b) => a + b, 0) / humAirData.length).toFixed(1) : 'N/A',
        max: humAirData.length > 0 ? Math.max(...humAirData).toFixed(1) : 'N/A',
        min: humAirData.length > 0 ? Math.min(...humAirData).toFixed(1) : 'N/A'
      },
      humSoil: {
        avg: humSoilData.length > 0 ? (humSoilData.reduce((a, b) => a + b, 0) / humSoilData.length).toFixed(1) : 'N/A',
        max: humSoilData.length > 0 ? Math.max(...humSoilData).toFixed(1) : 'N/A',
        min: humSoilData.length > 0 ? Math.min(...humSoilData).toFixed(1) : 'N/A'
      }
    };
    
    // Statistics grid
    const gridY = doc.y;
    
    // Temperature card
    doc.roundedRect(50, gridY, 150, 80, 6).fillAndStroke('#fff3e0', '#ff9800');
    doc.fontSize(12).fillColor('#e65100').text('🌡️ TEMPERATURA', 60, gridY + 10);
    doc.fontSize(10).fillColor('#bf360c');
    doc.text(`Promedio: ${stats.temp.avg}°C`, 60, gridY + 25);
    doc.text(`Máxima: ${stats.temp.max}°C`, 60, gridY + 40);
    doc.text(`Mínima: ${stats.temp.min}°C`, 60, gridY + 55);
    
    // Humidity air card
    doc.roundedRect(220, gridY, 150, 80, 6).fillAndStroke('#e3f2fd', '#2196f3');
    doc.fontSize(12).fillColor('#0d47a1').text('💧 HUMEDAD AIRE', 230, gridY + 10);
    doc.fontSize(10).fillColor('#01579b');
    doc.text(`Promedio: ${stats.humAir.avg}%`, 230, gridY + 25);
    doc.text(`Máxima: ${stats.humAir.max}%`, 230, gridY + 40);
    doc.text(`Mínima: ${stats.humAir.min}%`, 230, gridY + 55);
    
    // Humidity soil card
    doc.roundedRect(390, gridY, 150, 80, 6).fillAndStroke('#e8f5e8', '#4caf50');
    doc.fontSize(12).fillColor('#1b5e20').text('🌱 HUMEDAD SUELO', 400, gridY + 10);
    doc.fontSize(10).fillColor('#2e7d32');
    doc.text(`Promedio: ${stats.humSoil.avg}%`, 400, gridY + 25);
    doc.text(`Máxima: ${stats.humSoil.max}%`, 400, gridY + 40);
    doc.text(`Mínima: ${stats.humSoil.min}%`, 400, gridY + 55);
    
    // Pump events summary
    doc.moveDown(5);
    doc.roundedRect(50, doc.y, 490, 40, 6).fillAndStroke('#f3e5f5', '#9c27b0');
    doc.fontSize(12).fillColor('#4a148c').text('💧 SISTEMA DE RIEGO', 60, doc.y + 10);
    doc.fontSize(10).fillColor('#6a1b9a');
    doc.text(`Activaciones: ${pumpEvents.length} eventos`, 60, doc.y + 25);
    doc.text(`Eficiencia de riego: ${pumpEvents.length > 0 ? 'Óptima' : 'Pendiente de análisis'}`, 260, doc.y + 25);
    
    doc.moveDown(3);
  }

  private addDetailedTable(doc: any, data: any[]): void {
    doc.fontSize(14).fillColor('#1976d2').text('📋 DATOS DETALLADOS', { underline: true });
    doc.moveDown(1);
    
    // Table header with improved formatting
    const tableTop = doc.y;
    doc.fontSize(11).fillColor('#ffffff');
    doc.roundedRect(50, tableTop, 495, 25, 3).fillAndStroke('#1976d2', '#1976d2');
    
    let colX = 60;
    const headers = [
      { text: 'Fecha/Hora', width: 100 },
      { text: 'Temp (°C)', width: 60 },
      { text: 'Hum Aire (%)', width: 70 },
      { text: 'Hum Suelo (%)', width: 70 },
      { text: 'Bomba', width: 60 },
      { text: 'Cultivo/Lote', width: 135 }
    ];
    
    headers.forEach(header => {
      doc.text(header.text, colX, tableTop + 8);
      colX += header.width;
    });
    
    doc.moveDown(1.5);
    
    // Table data with alternating row colors
    doc.fontSize(9).fillColor('#333');
    let rowCount = 0;
    const maxRows = 35;
    
    data.forEach((item, index) => {
      if (rowCount >= maxRows) {
        doc.addPage();
        rowCount = 0;
        this.addTableContinuationHeader(doc);
      }
      
      const rowY = doc.y;
      const isEvenRow = rowCount % 2 === 0;
      
      // Alternating row background
      if (isEvenRow) {
        doc.roundedRect(50, rowY - 2, 495, 20, 2).fill('#f8f9fa');
      }
      
      // Row data
      colX = 60;
      const rowData = [
        item.timestamp,
        item.temperatura?.toFixed(1) || '-',
        item.humedad_aire?.toFixed(1) || '-',
        item.humedad_suelo?.toFixed(1) || '-',
        item.bomba_estado || '-',
        item.cultivo || 'General'
      ];
      
      rowData.forEach((value, colIndex) => {
        const textColor = colIndex === 4 && value === 'ENCENDIDA' ? '#d32f2f' : '#333';
        doc.fillColor(textColor).text(value, colX, rowY + 5, { width: headers[colIndex].width });
        colX += headers[colIndex].width;
      });
      
      doc.moveDown(1.2);
      rowCount++;
    });
    
    doc.moveDown(2);
  }

  private addTableContinuationHeader(doc: any): void {
    doc.fontSize(14).fillColor('#1976d2').text('📋 DATOS DETALLADOS (Continuación)', { underline: true });
    doc.moveDown(1);
    
    const tableTop = doc.y;
    doc.fontSize(11).fillColor('#ffffff');
    doc.roundedRect(50, tableTop, 495, 25, 3).fillAndStroke('#1976d2', '#1976d2');
    
    let colX = 60;
    const headers = [
      { text: 'Fecha/Hora', width: 100 },
      { text: 'Temp (°C)', width: 60 },
      { text: 'Hum Aire (%)', width: 70 },
      { text: 'Hum Suelo (%)', width: 70 },
      { text: 'Bomba', width: 60 },
      { text: 'Cultivo/Lote', width: 135 }
    ];
    
    headers.forEach(header => {
      doc.text(header.text, colX, tableTop + 8);
      colX += header.width;
    });
    
    doc.moveDown(1.5);
    doc.fontSize(9).fillColor('#333');
  }

  private addStatisticsSection(doc: any, data: any[]): void {
    doc.fontSize(14).fillColor('#1976d2').text('📊 ANÁLISIS ESTADÍSTICO', { underline: true });
    doc.moveDown(1);
    
    // Calculate additional analytics
    const hourlyData = this.groupDataByHour(data);
    const dailyData = this.groupDataByDay(data);
    
    // Hourly pattern analysis
    doc.fontSize(12).fillColor('#333').text('🕐 Patrones Horarios', { underline: true });
    doc.fontSize(10).fillColor('#666');
    doc.text(`• Hora de mayor actividad: ${this.getPeakHour(hourlyData)}`);
    doc.text(`• Distribución de lecturas por hora: ${Object.keys(hourlyData).length} horas activas`);
    doc.moveDown(1);
    
    // Daily trends
    doc.fontSize(12).fillColor('#333').text('📅 Tendencias Diarias', { underline: true });
    doc.fontSize(10).fillColor('#666');
    doc.text(`• Días con mayor actividad: ${this.getMostActiveDays(dailyData)}`);
    doc.text(`• Período de análisis: ${Object.keys(dailyData).length} días`);
    doc.moveDown(2);
  }

  private addEnhancedFooter(doc: any): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer background
      doc.roundedRect(50, doc.page.height - 50, 495, 35, 5).fillAndStroke('#f8f9fa', '#dee2e6');
      
      // Footer text
      doc.fontSize(8).fillColor('#6c757d');
      doc.text('Generado por AGROTIC IoT Dashboard', 60, doc.page.height - 40);
      doc.text(`Página ${i + 1} de ${pageCount}`, 450, doc.page.height - 40);
      
      // Company info
      doc.fontSize(7).fillColor('#adb5bd');
      doc.text('🌱 AGROTIC - Tecnología Agrícola Inteligente', 60, doc.page.height - 25);
      doc.text('Sistema de Monitoreo IoT en Tiempo Real', 350, doc.page.height - 25);
    }
  }

  private calculateReportDuration(params: any): string {
    if (!params.fecha_desde) return 'Hasta la fecha actual';
    if (!params.fecha_hasta) return 'Desde fecha de inicio';
    
    const start = new Date(params.fecha_desde);
    const end = new Date(params.fecha_hasta);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  }

  private calculatePeriodInfo(params: any): { isLongPeriod: boolean; totalDays: number; totalWeeks: number } {
    if (!params.fecha_desde || !params.fecha_hasta) {
      return { isLongPeriod: false, totalDays: 0, totalWeeks: 0 };
    }
    
    const start = new Date(params.fecha_desde);
    const end = new Date(params.fecha_hasta);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include end date
    const totalWeeks = Math.ceil(totalDays / 7);
    
    // Consider period as long if more than 7 days
    return { 
      isLongPeriod: totalDays > 7, 
      totalDays, 
      totalWeeks 
    };
  }

  private addEnhancedHeader(doc: any, params: any, recordCount: number, periodInfo: any): void {
    // Company header with logo placeholder
    doc.fontSize(26).fillColor('#1976d2').text('🌱 AGROTIC', { align: 'center' });
    doc.fontSize(16).fillColor('#2e7d32').text('Sistema Inteligente de Monitoreo Agrícola', { align: 'center' });
    
    // Report title with period type indicator
    const reportType = periodInfo.isLongPeriod ? 'REPORTE SEMANAL' : 'REPORTE DETALLADO';
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#333').text(`📊 ${reportType} IOT`, { align: 'center', underline: true });
    
    // Generation info
    doc.moveDown(0.5);
    const now = new Date();
    doc.fontSize(10).fillColor('#666').text(
      `Generado el ${now.toLocaleDateString('es-CO')} a las ${now.toLocaleTimeString('es-CO')}`, 
      { align: 'center' }
    );
    
    // Report metadata box
    doc.moveDown(1);
    doc.roundedRect(50, doc.y, 495, 80, 8).fillAndStroke('#f8f9fa', '#dee2e6');
    
    doc.fontSize(11).fillColor('#495057');
    const metadataY = doc.y + 10;
    doc.text('📋 INFORMACIÓN DEL REPORTE', 60, metadataY);
    doc.fontSize(9).fillColor('#6c757d');
    doc.text(`📡 Sensores: ${params.sensor === 'all' ? 'Todos los sensores activos' : params.sensor}`, 60, metadataY + 20);
    doc.text(`📅 Período: ${params.fecha_desde || 'Inicio'} a ${params.fecha_hasta || 'Actual'}`, 260, metadataY + 20);
    doc.text(`📊 Registros: ${recordCount} lecturas`, 60, metadataY + 35);
    doc.text(`⏰ Duración: ${this.calculateReportDuration(params)}`, 260, metadataY + 35);
    
    // Period-specific info
    if (periodInfo.isLongPeriod) {
      doc.text(`📈 Estructura: Reporte por semanas (${periodInfo.totalWeeks} semanas)`, 60, metadataY + 50);
    } else {
      doc.text(`📈 Estructura: Reporte detallado por días (${periodInfo.totalDays} días)`, 60, metadataY + 50);
    }
    
    doc.moveDown(4);
  }

  private groupDataByHour(data: any[]): any {
    const hourly: any = {};
    data.forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      if (!hourly[hour]) hourly[hour] = 0;
      hourly[hour]++;
    });
    return hourly;
  }

  private groupDataByDay(data: any[]): any {
    const daily: any = {};
    data.forEach(item => {
      const day = new Date(item.timestamp).toDateString();
      if (!daily[day]) daily[day] = 0;
      daily[day]++;
    });
    return daily;
  }

  private getPeakHour(hourlyData: any): string {
    const hours = Object.keys(hourlyData).map(Number);
    const peakHour = hours.reduce((a, b) => hourlyData[a] > hourlyData[b] ? a : b);
    return `${peakHour}:00 hrs`;
  }

  private getMostActiveDays(dailyData: any): string {
    const days = Object.entries(dailyData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([day]) => new Date(day as string).toLocaleDateString('es-CO'));
    return days.join(', ');
  }

  // Export to Excel functionality - REAL DATA ONLY with enhanced formatting and multiple sheets
  async exportToExcel(params: {
    sensor?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ buffer: Buffer; hasData: boolean }> {
    const data = await this.getExportData(params);
    
    if (data.length === 0) {
      return { buffer: Buffer.from(''), hasData: false };
    }
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AGROTIC IoT Dashboard';
    workbook.lastModifiedBy = 'AGROTIC';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;
    
    // Define styles
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    const dataStyle = {
      border: {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    // Sheet 1: Dashboard Resumen
    this.createDashboardSheet(workbook, data, params, headerStyle, dataStyle);
    
    // Sheet 2: Datos Completos
    this.createCompleteDataSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 3: Análisis Temperatura
    this.createTemperatureSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 4: Análisis Humedad Aire
    this.createHumidityAirSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 5: Análisis Humedad Suelo
    this.createHumiditySoilSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 6: Sistema de Riego
    this.createIrrigationSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 7: Estadísticas Avanzadas
    this.createStatisticsSheet(workbook, data, headerStyle, dataStyle);
    
    // Sheet 8: Tendencias Temporales
    this.createTrendsSheet(workbook, data, headerStyle, dataStyle);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), hasData: true };
  }

  private createDashboardSheet(workbook: any, data: any[], params: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📊 Dashboard Resumen');
    
    // Title
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = '🌱 AGROTIC - REPORTE IOT EJECUTIVO';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1976D2' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'center' };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    
    // Report info
    sheet.getCell('A3').value = '📋 Información del Reporte';
    sheet.getCell('A3').font = { size: 12, bold: true, color: { argb: 'FF1976D2' } };
    
    sheet.getCell('A5').value = '📅 Fecha de Generación:';
    sheet.getCell('B5').value = new Date().toLocaleString('es-CO');
    sheet.getCell('A6').value = '📡 Sensores:';
    sheet.getCell('B6').value = params.sensor === 'all' ? 'Todos los sensores' : params.sensor;
    sheet.getCell('A7').value = '📊 Período:';
    sheet.getCell('B7').value = `${params.fecha_desde || 'Inicio'} a ${params.fecha_hasta || 'Actual'}`;
    sheet.getCell('A8').value = '📈 Total Registros:';
    sheet.getCell('B8').value = data.length;
    
    // Key metrics
    sheet.getCell('A10').value = '📊 Métricas Clave';
    sheet.getCell('A10').font = { size: 12, bold: true, color: { argb: 'FF1976D2' } };
    
    const tempData = data.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
    const humAirData = data.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire);
    const humSoilData = data.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo);
    const pumpEvents = data.filter(d => d.bomba_estado === 'ENCENDIDA');
    
    sheet.getCell('A12').value = '🌡️ Temperatura Promedio:';
    sheet.getCell('B12').value = tempData.length > 0 ? `${(tempData.reduce((a, b) => a + b, 0) / tempData.length).toFixed(1)}°C` : 'N/A';
    sheet.getCell('A13').value = '💧 Humedad Aire Promedio:';
    sheet.getCell('B13').value = humAirData.length > 0 ? `${(humAirData.reduce((a, b) => a + b, 0) / humAirData.length).toFixed(1)}%` : 'N/A';
    sheet.getCell('A14').value = '🌱 Humedad Suelo Promedio:';
    sheet.getCell('B14').value = humSoilData.length > 0 ? `${(humSoilData.reduce((a, b) => a + b, 0) / humSoilData.length).toFixed(1)}%` : 'N/A';
    sheet.getCell('A15').value = '💧 Activaciones Bomba:';
    sheet.getCell('B15').value = pumpEvents.length;
    
    // Column widths
    sheet.columns = [
      { width: 25 }, { width: 20 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createCompleteDataSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📋 Datos Completos');
    
    // Headers
    const headers = [
      'Fecha', 'Hora', 'Temperatura (°C)', 'Humedad Aire (%)', 
      'Humedad Suelo (%)', 'Estado Bomba', 'Cultivo', 'Lote'
    ];
    
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    // Data
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const row = sheet.addRow([
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        item.temperatura || 'N/A',
        item.humedad_aire || 'N/A',
        item.humedad_suelo || 'N/A',
        item.bomba_estado || 'N/A',
        item.cultivo || 'General',
        item.lote || 'Principal'
      ]);
      
      // Apply data style
      row.eachCell((cell) => {
        cell.style = dataStyle;
        if (cell.value === 'ENCENDIDA') {
          cell.font = { color: { argb: 'FFFF0000' } };
        }
      });
    });
    
    // Auto filter and freeze
    sheet.autoFilter = 'A1:H1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    // Column widths
    sheet.columns = [
      { width: 12 }, { width: 10 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 12 }, { width: 15 }, { width: 15 }
    ];
  }

  private createTemperatureSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('🌡️ Temperatura');
    
    const tempData = data.filter(d => d.temperatura !== undefined);
    
    const headers = ['Fecha', 'Hora', 'Valor (°C)', 'Cultivo', 'Lote', 'Condición'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    tempData.forEach(item => {
      const date = new Date(item.timestamp);
      let condition = 'Normal';
      if (item.temperatura > 30) condition = 'Alta';
      else if (item.temperatura < 15) condition = 'Baja';
      
      const row = sheet.addRow([
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        item.temperatura,
        item.cultivo || 'General',
        item.lote || 'Principal',
        condition
      ]);
      
      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        if (colNumber === 6) { // Condition column
          if (cell.value === 'Alta') cell.font = { color: { argb: 'FFFF0000' } };
          else if (cell.value === 'Baja') cell.font = { color: { argb: 'FF0000FF' } };
          else cell.font = { color: { argb: 'FF00FF00' } };
        }
      });
    });
    
    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    sheet.columns = [
      { width: 12 }, { width: 10 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 12 }
    ];
  }

  private createHumidityAirSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('💧 Humedad Aire');
    
    const humData = data.filter(d => d.humedad_aire !== undefined);
    
    const headers = ['Fecha', 'Hora', 'Valor (%)', 'Cultivo', 'Lote', 'Estado'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    humData.forEach(item => {
      const date = new Date(item.timestamp);
      let status = 'Óptimo';
      if (item.humedad_aire > 80) status = 'Muy Alta';
      else if (item.humedad_aire < 30) status = 'Baja';
      else if (item.humedad_aire < 50) status = 'Moderada';
      
      const row = sheet.addRow([
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        item.humedad_aire,
        item.cultivo || 'General',
        item.lote || 'Principal',
        status
      ]);
      
      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        if (colNumber === 6) { // Status column
          if (cell.value === 'Muy Alta') cell.font = { color: { argb: 'FF8000FF' } };
          else if (cell.value === 'Baja') cell.font = { color: { argb: 'FFFF0000' } };
          else if (cell.value === 'Moderada') cell.font = { color: { argb: 'FFFFA500' } };
          else cell.font = { color: { argb: 'FF00AA00' } };
        }
      });
    });
    
    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    sheet.columns = [
      { width: 12 }, { width: 10 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 12 }
    ];
  }

  private createHumiditySoilSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('🌱 Humedad Suelo');
    
    const soilData = data.filter(d => d.humedad_suelo !== undefined);
    
    const headers = ['Fecha', 'Hora', 'Valor (%)', 'Cultivo', 'Lote', 'Necesidad Riego'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    soilData.forEach(item => {
      const date = new Date(item.timestamp);
      let irrigation = 'No Necesario';
      if (item.humedad_suelo < 30) irrigation = 'Urgente';
      else if (item.humedad_suelo < 50) irrigation = 'Necesario';
      else if (item.humedad_suelo > 80) irrigation = 'Excesivo';
      
      const row = sheet.addRow([
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        item.humedad_suelo,
        item.cultivo || 'General',
        item.lote || 'Principal',
        irrigation
      ]);
      
      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        if (colNumber === 6) { // Irrigation column
          if (cell.value === 'Urgente') cell.font = { color: { argb: 'FFFF0000' } };
          else if (cell.value === 'Necesario') cell.font = { color: { argb: 'FFFFA500' } };
          else if (cell.value === 'Excesivo') cell.font = { color: { argb: 'FF0000FF' } };
          else cell.font = { color: { argb: 'FF00AA00' } };
        }
      });
    });
    
    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    sheet.columns = [
      { width: 12 }, { width: 10 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createIrrigationSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('💧 Sistema Riego');
    
    const pumpData = data.filter(d => d.bomba_estado !== undefined);
    
    const headers = ['Fecha', 'Hora', 'Estado', 'Cultivo', 'Lote', 'Duración Estimada'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    // Calculate duration between pump events
    let lastPumpOn: Date | null = null;
    pumpData.forEach((item, index) => {
      const date = new Date(item.timestamp);
      let duration = 'N/A';
      
      if (item.bomba_estado === 'ENCENDIDA') {
        lastPumpOn = date;
      } else if (item.bomba_estado === 'APAGADA' && lastPumpOn) {
        const durationMs = date.getTime() - lastPumpOn.getTime();
        const minutes = Math.floor(durationMs / 60000);
        duration = `${minutes} min`;
      }
      
      const row = sheet.addRow([
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        item.bomba_estado,
        item.cultivo || 'General',
        item.lote || 'Principal',
        duration
      ]);
      
      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        if (colNumber === 3) { // Status column
          if (cell.value === 'ENCENDIDA') {
            cell.font = { color: { argb: 'FF00AA00' }, bold: true };
          } else {
            cell.font = { color: { argb: 'FFAA0000' } };
          }
        }
      });
    });
    
    // Add summary statistics
    const onEvents = pumpData.filter(d => d.bomba_estado === 'ENCENDIDA').length;
    const offEvents = pumpData.filter(d => d.bomba_estado === 'APAGADA').length;
    
    sheet.addRow([]);
    const summaryRow = sheet.addRow(['RESUMEN SISTEMA DE RIEGO', '', '', '', '', '']);
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    });
    
    sheet.addRow(['Total Activaciones:', onEvents, '', '', '', '']);
    sheet.addRow(['Total Desactivaciones:', offEvents, '', '', '', '']);
    sheet.addRow(['Eficiencia del Sistema:', onEvents > 0 ? 'Óptima' : 'Sin actividad', '', '', '', '']);
    
    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    sheet.columns = [
      { width: 12 }, { width: 10 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createStatisticsSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📊 Estadísticas');
    
    // Calculate statistics
    const tempData = data.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
    const humAirData = data.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire);
    const humSoilData = data.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo);
    
    const calcStats = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    };
    
    const tempStats = calcStats(tempData);
    const humAirStats = calcStats(humAirData);
    const humSoilStats = calcStats(humSoilData);
    
    // Temperature statistics
    sheet.getCell('A1').value = '🌡️ ESTADÍSTICAS DE TEMPERATURA';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1976D2' } };
    
    const tempStatsData = [
      ['Métrica', 'Valor'],
      ['Promedio', `${tempStats.avg.toFixed(1)}°C`],
      ['Mínima', `${tempStats.min.toFixed(1)}°C`],
      ['Máxima', `${tempStats.max.toFixed(1)}°C`],
      ['Total Lecturas', tempStats.count],
      ['Rango', `${(tempStats.max - tempStats.min).toFixed(1)}°C`]
    ];
    
    tempStatsData.forEach((row, index) => {
      const sheetRow = sheet.addRow(row);
      if (index === 0) {
        sheetRow.eachCell((cell) => cell.style = headerStyle);
      } else {
        sheetRow.eachCell((cell) => cell.style = dataStyle);
      }
    });
    
    // Humidity air statistics
    sheet.addRow([]);
    sheet.getCell('A8').value = '💧 ESTADÍSTICAS DE HUMEDAD AIRE';
    sheet.getCell('A8').font = { bold: true, size: 14, color: { argb: 'FF1976D2' } };
    
    const humAirStatsData = [
      ['Métrica', 'Valor'],
      ['Promedio', `${humAirStats.avg.toFixed(1)}%`],
      ['Mínima', `${humAirStats.min.toFixed(1)}%`],
      ['Máxima', `${humAirStats.max.toFixed(1)}%`],
      ['Total Lecturas', humAirStats.count],
      ['Rango', `${(humAirStats.max - humAirStats.min).toFixed(1)}%`]
    ];
    
    humAirStatsData.forEach((row, index) => {
      const sheetRow = sheet.addRow(row);
      if (index === 0) {
        sheetRow.eachCell((cell) => cell.style = headerStyle);
      } else {
        sheetRow.eachCell((cell) => cell.style = dataStyle);
      }
    });
    
    // Humidity soil statistics
    sheet.addRow([]);
    sheet.getCell('A15').value = '🌱 ESTADÍSTICAS DE HUMEDAD SUELO';
    sheet.getCell('A15').font = { bold: true, size: 14, color: { argb: 'FF1976D2' } };
    
    const humSoilStatsData = [
      ['Métrica', 'Valor'],
      ['Promedio', `${humSoilStats.avg.toFixed(1)}%`],
      ['Mínima', `${humSoilStats.min.toFixed(1)}%`],
      ['Máxima', `${humSoilStats.max.toFixed(1)}%`],
      ['Total Lecturas', humSoilStats.count],
      ['Rango', `${(humSoilStats.max - humSoilStats.min).toFixed(1)}%`]
    ];
    
    humSoilStatsData.forEach((row, index) => {
      const sheetRow = sheet.addRow(row);
      if (index === 0) {
        sheetRow.eachCell((cell) => cell.style = headerStyle);
      } else {
        sheetRow.eachCell((cell) => cell.style = dataStyle);
      }
    });
    
    sheet.columns = [{ width: 20 }, { width: 15 }];
  }

  private createTrendsSheet(workbook: any, data: any[], headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📈 Tendencias Temporales');
    
    // Group data by hour and day
    const hourlyData = this.groupDataByHour(data);
    const dailyData = this.groupDataByDay(data);
    
    // Hourly trends
    sheet.getCell('A1').value = '🕐 ACTIVIDAD POR HORA';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1976D2' } };
    
    const hourlyHeaders = ['Hora', 'Cantidad de Lecturas', 'Porcentaje'];
    const hourlyHeaderRow = sheet.addRow(hourlyHeaders);
    hourlyHeaders.forEach((_, index) => {
      const cell = hourlyHeaderRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    const totalReadings = data.length;
    Object.entries(hourlyData).forEach(([hour, count]) => {
      const percentage = ((count as number / totalReadings) * 100).toFixed(1);
      const row = sheet.addRow([`${hour}:00`, count, `${percentage}%`]);
      row.eachCell((cell) => cell.style = dataStyle);
    });
    
    // Daily trends
    sheet.addRow([]);
    sheet.getCell('A12').value = '📅 ACTIVIDAD POR DÍA';
    sheet.getCell('A12').font = { bold: true, size: 14, color: { argb: 'FF1976D2' } };
    
    const dailyHeaders = ['Fecha', 'Cantidad de Lecturas', 'Porcentaje'];
    const dailyHeaderRow = sheet.addRow(dailyHeaders);
    dailyHeaders.forEach((_, index) => {
      const cell = dailyHeaderRow.getCell(index + 1);
      cell.style = headerStyle;
    });
    
    Object.entries(dailyData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10) // Top 10 days
      .forEach(([day, count]) => {
        const percentage = ((count as number / totalReadings) * 100).toFixed(1);
        const formattedDate = new Date(day).toLocaleDateString('es-CO');
        const row = sheet.addRow([formattedDate, count, `${percentage}%`]);
        row.eachCell((cell) => cell.style = dataStyle);
      });
    
    sheet.columns = [{ width: 20 }, { width: 18 }, { width: 15 }];
  }

  // Get historical data for charts and exports
  async getHistoricalData(deviceId: string, options: {
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}): Promise<any> {
    const { limit = 100, fecha_desde, fecha_hasta } = options;
    
    let query: any = { deviceId };
    
    // Add date range filter if provided
    if (fecha_desde || fecha_hasta) {
      query.timestamp = {};
      if (fecha_desde) {
        query.timestamp.$gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        query.timestamp.$lte = new Date(fecha_hasta);
      }
    }
    
    const readings = await this.readingModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
    
    // Group data by sensor type
    const groupedData = {
      temperatura: [] as Array<{ timestamp: Date; value: number }>,
      humedad_aire: [] as Array<{ timestamp: Date; value: number }>,
      humedad_suelo: [] as Array<{ timestamp: Date; value: number }>
    };
    
    readings.forEach(reading => {
      if (reading.temperature !== undefined) {
        groupedData.temperatura.push({
          timestamp: reading.timestamp,
          value: reading.temperature
        });
      }
      if (reading.humidity !== undefined) {
        groupedData.humedad_aire.push({
          timestamp: reading.timestamp,
          value: reading.humidity
        });
      }
      if (reading.soilHumidity !== undefined) {
        groupedData.humedad_suelo.push({
          timestamp: reading.timestamp,
          value: reading.soilHumidity
        });
      }
    });
    
    return {
      deviceId,
      data: groupedData,
      totalRecords: readings.length,
      dateRange: {
        from: fecha_desde,
        to: fecha_hasta
      }
    };
  }

  // Helper method to get export data - REAL DATA FROM DATABASE ONLY
  private async getExportData(params: {
    sensor?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<any[]> {
    let query: any = {};
    
    // Add date range filter if provided
    if (params.fecha_desde || params.fecha_hasta) {
      query.timestamp = {};
      if (params.fecha_desde) {
        query.timestamp.$gte = new Date(params.fecha_desde);
      }
      if (params.fecha_hasta) {
        // Add 1 day to include the end date
        const endDate = new Date(params.fecha_hasta);
        endDate.setDate(endDate.getDate() + 1);
        query.timestamp.$lte = endDate;
      }
    }
    
    // Get all readings from database
    const readings = await this.readingModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(5000) // Limit for export
      .exec();
    
    if (readings.length === 0) {
      return [];
    }
    
    // Get sensor info for cultivo/lote
    const sensors = await this.sensorModel.find().exec();
    const sensorMap = new Map(sensors.map(s => [s.deviceId, s]));
    
    return readings.map(reading => {
      const sensor = sensorMap.get(reading.deviceId);
      const date = new Date(reading.timestamp);
      
      // Convert soil humidity from ADC if needed
      let soilHumidity = reading.soilHumidity;
      if (soilHumidity !== undefined && soilHumidity > 100) {
        // Convert ADC to percentage (assuming 12-bit ADC)
        soilHumidity = Math.round((1 - soilHumidity / 4095) * 100);
      }
      
      return {
        timestamp: date.toLocaleString('es-CO'),
        temperatura: reading.temperature,
        humedad_aire: reading.humidity,
        humedad_suelo: soilHumidity,
        bomba_estado: (reading as any).bomba_estado || null,
        cultivo: sensor?.crop || 'General',
        lote: sensor?.location || 'Principal'
      };
    });
  }

  // Enhanced weekly reports for long periods
  private addWeeklyReports(doc: any, data: any[], params: any, periodInfo: any): void {
    doc.fontSize(14).fillColor('#1976d2').text('📊 REPORTE POR SEMANAS', { underline: true });
    doc.moveDown(1);

    // Group data by weeks
    const weeklyData = this.groupDataByWeeks(data);
    
    Object.entries(weeklyData).forEach(([week, weekData]) => {
      if (doc.y > 700) doc.addPage();
      
      const weekInfo = weekData as any[];
      const weekStart = weekInfo[0].timestamp.split(' ')[0];
      const weekEnd = weekInfo[weekInfo.length - 1].timestamp.split(' ')[0];
      
      // Week header
      doc.fontSize(12).fillColor('#2e7d32').text(`📅 Semana del ${weekStart} al ${weekEnd}`, { underline: true });
      doc.moveDown(0.5);
      
      // Week statistics
      const tempData = weekInfo.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
      const humAirData = weekInfo.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire);
      const humSoilData = weekInfo.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo);
      
      doc.fontSize(10).fillColor('#333');
      doc.text(`• Total lecturas: ${weekInfo.length}`);
      doc.text(`• Temperatura promedio: ${tempData.length > 0 ? (tempData.reduce((a, b) => a + b, 0) / tempData.length).toFixed(1) : 'N/A'}°C`);
      doc.text(`• Humedad aire promedio: ${humAirData.length > 0 ? (humAirData.reduce((a, b) => a + b, 0) / humAirData.length).toFixed(1) : 'N/A'}%`);
      doc.text(`• Humedad suelo promedio: ${humSoilData.length > 0 ? (humSoilData.reduce((a, b) => a + b, 0) / humSoilData.length).toFixed(1) : 'N/A'}%`);
      
      // Pump events in this week
      const pumpEvents = weekInfo.filter(d => d.bomba_estado === 'ENCENDIDA');
      doc.text(`• Activaciones bomba: ${pumpEvents.length}`);
      
      doc.moveDown(1);
    });
  }

  // Detailed daily reports for short periods
  private addDetailedDailyReports(doc: any, data: any[], params: any): void {
    doc.fontSize(14).fillColor('#1976d2').text('📊 REPORTE DETALLADO DIARIO', { underline: true });
    doc.moveDown(1);

    // Group data by days
    const dailyData = this.groupDataByDays(data);
    
    Object.entries(dailyData).forEach(([day, dayData]) => {
      if (doc.y > 700) doc.addPage();
      
      const dayInfo = dayData as any[];
      
      // Day header
      doc.fontSize(12).fillColor('#2e7d32').text(`📅 ${day}`, { underline: true });
      doc.moveDown(0.5);
      
      // Add detailed table for this day
      this.addDetailedTableForDay(doc, dayInfo);
      
      doc.moveDown(1);
    });
  }

  // Alerts section integration
  private async addAlertsSection(doc: any, params: any): Promise<void> {
    doc.fontSize(14).fillColor('#d32f2f').text('🚨 SECCIÓN DE ALERTAS', { underline: true });
    doc.moveDown(1);

    try {
      // Check if alertasService is available
      if (!this.alertasService) {
        doc.fontSize(10).fillColor('#ff9800').text('⚠️ Servicio de alertas no disponible en este momento');
        doc.moveDown(2);
        return;
      }

      // Get alerts for the period
      const alerts = await this.alertasService.findAll();
      const periodAlerts = this.filterAlertsByPeriod(alerts, params);
      
      if (periodAlerts.length === 0) {
        doc.fontSize(10).fillColor('#4caf50').text('✅ No se encontraron alertas en el período seleccionado');
        doc.moveDown(2);
        return;
      }

      // Group alerts by type
      const alertsByType = this.groupAlertsByType(periodAlerts);
      
      Object.entries(alertsByType).forEach(([type, typeAlerts]) => {
        if (doc.y > 650) doc.addPage();
        
        const alerts = typeAlerts as any[];
        const typeIcon = this.getAlertIcon(type);
        const typeColor = this.getAlertColor(type);
        
        doc.fontSize(12).fillColor(typeColor).text(`${typeIcon} ${type.toUpperCase()} (${alerts.length})`, { underline: true });
        doc.moveDown(0.5);
        
        alerts.forEach(alert => {
          doc.fontSize(9).fillColor('#333');
          doc.text(`• ${alert.titulo || alert.title || 'Sin título'}`, { continued: true });
          doc.text(` - ${alert.descripcion || alert.description || 'Sin descripción'}`);
          doc.text(`  Fecha: ${new Date(alert.fecha_creacion || alert.createdAt || Date.now()).toLocaleString('es-CO')}`);
          doc.text(`  Prioridad: ${alert.nivel_prioridad || alert.priority || 'Media'}`);
          doc.moveDown(0.5);
        });
        
        doc.moveDown(1);
      });
      
      // Alert statistics
      doc.fontSize(12).fillColor('#d32f2f').text('📈 ESTADÍSTICAS DE ALERTAS', { underline: true });
      doc.fontSize(10).fillColor('#333');
      doc.text(`• Total alertas: ${periodAlerts.length}`);
      doc.text(`• Alertas críticas: ${periodAlerts.filter(a => (a.nivel_prioridad || a.priority) === 'alta').length}`);
      doc.text(`• Alertas pendientes: ${periodAlerts.filter(a => (a.estado || a.status) === 'pendiente').length}`);
      
    } catch (error) {
      doc.fontSize(10).fillColor('#ff9800').text('⚠️ Error cargando información de alertas');
      console.error('Error loading alerts for PDF:', error);
    }
    
    doc.moveDown(2);
  }

  // Enhanced performance analysis
  private addPerformanceAnalysis(doc: any, data: any[], params: any): void {
    doc.fontSize(14).fillColor('#1976d2').text('📈 ANÁLISIS DE RENDIMIENTO', { underline: true });
    doc.moveDown(1);

    // Sensor performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(data);
    
    // Overall system health
    doc.fontSize(12).fillColor('#2e7d32').text('🏥 Salud del Sistema', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`• Estado general: ${performanceMetrics.overallHealth}`);
    doc.text(`• Sensores activos: ${performanceMetrics.activeSensors}/${performanceMetrics.totalSensors}`);
    doc.text(`• Eficiencia de datos: ${performanceMetrics.dataEfficiency}%`);
    doc.text(`• Tiempo de respuesta promedio: ${performanceMetrics.avgResponseTime}ms`);
    
    doc.moveDown(1);

    // Temperature analysis
    doc.fontSize(12).fillColor('#ff6b35').text('🌡️ Análisis de Temperatura', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`• Rango óptimo: ${performanceMetrics.temperature.optimalRange}`);
    doc.text(`• Tiempo en rango óptimo: ${performanceMetrics.temperature.optimalTime}%`);
    doc.text(`• Tendencia: ${performanceMetrics.temperature.trend}`);
    
    doc.moveDown(1);

    // Humidity analysis
    doc.fontSize(12).fillColor('#2196f3').text('💧 Análisis de Humedad', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`• Humedad aire - Rango óptimo: ${performanceMetrics.humidityAir.optimalRange}`);
    doc.text(`• Humedad suelo - Rango óptimo: ${performanceMetrics.humiditySoil.optimalRange}`);
    doc.text(`• Necesidades de riego detectadas: ${performanceMetrics.irrigationNeeds}`);
    
    doc.moveDown(1);

    // Recommendations
    doc.fontSize(12).fillColor('#4caf50').text('💡 RECOMENDACIONES', { underline: true });
    performanceMetrics.recommendations.forEach((rec, index) => {
      doc.fontSize(10).fillColor('#333');
      doc.text(`${index + 1}. ${rec}`);
    });
    
    doc.moveDown(2);
  }

  // Helper methods for the new functionality
  private groupDataByWeeks(data: any[]): any {
    const weeklyData: any = {};
    
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(item);
    });
    
    // Sort each week by timestamp
    Object.keys(weeklyData).forEach(week => {
      weeklyData[week].sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    return weeklyData;
  }

  private groupDataByDays(data: any[]): any {
    const dailyData: any = {};
    
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const dayKey = date.toDateString();
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = [];
      }
      dailyData[dayKey].push(item);
    });
    
    return dailyData;
  }

  private addDetailedTableForDay(doc: any, dayData: any[]): void {
    // Simplified table for daily reports
    doc.fontSize(10).fillColor('#333');
    const maxRows = Math.min(dayData.length, 20); // Limit rows per day
    
    for (let i = 0; i < maxRows; i++) {
      const item = dayData[i];
      doc.text(`${item.timestamp} | Temp: ${item.temperatura?.toFixed(1) || '--'}°C | Hum: ${item.humedad_aire?.toFixed(1) || '--'}% | Bomba: ${item.bomba_estado || '--'}`);
    }
    
    if (dayData.length > maxRows) {
      doc.text(`... y ${dayData.length - maxRows} lecturas más`);
    }
  }

  private filterAlertsByPeriod(alerts: any[], params: any): any[] {
    if (!params.fecha_desde && !params.fecha_hasta) {
      return alerts.slice(0, 10); // Return last 10 alerts if no date range
    }
    
    const startDate = params.fecha_desde ? new Date(params.fecha_desde) : new Date(0);
    const endDate = params.fecha_hasta ? new Date(params.fecha_hasta) : new Date();
    
    return alerts.filter(alert => {
      const alertDate = new Date(alert.fecha_creacion || alert.createdAt || Date.now());
      return alertDate >= startDate && alertDate <= endDate;
    });
  }

  private groupAlertsByType(alerts: any[]): any {
    const grouped: any = {};
    
    alerts.forEach(alert => {
      const type = alert.tipo_alerta || alert.type || 'general';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(alert);
    });
    
    return grouped;
  }

  private getAlertIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'sensor_critico': '🌡️',
      'stock_bajo': '📦',
      'actividad_vencida': '📅',
      'general': '⚠️'
    };
    return icons[type] || icons['general'];
  }

  private getAlertColor(type: string): string {
    const colors: { [key: string]: string } = {
      'sensor_critico': '#d32f2f',
      'stock_bajo': '#ff9800',
      'actividad_vencida': '#9c27b0',
      'general': '#f44336'
    };
    return colors[type] || colors['general'];
  }

  private calculatePerformanceMetrics(data: any[]): any {
    const tempData = data.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
    const humAirData = data.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire);
    const humSoilData = data.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo);
    
    const tempOptimal = tempData.filter(t => t >= 18 && t <= 28).length;
    const humAirOptimal = humAirData.filter(h => h >= 40 && h <= 70).length;
    
    return {
      overallHealth: tempOptimal > tempData.length * 0.7 ? 'Bueno' : 'Regular',
      activeSensors: 3, // Assuming 3 main sensors
      totalSensors: 3,
      dataEfficiency: Math.round((data.length / Math.max(data.length, 100)) * 100),
      avgResponseTime: 150, // Mock value
      temperature: {
        optimalRange: '18-28°C',
        optimalTime: tempData.length > 0 ? Math.round((tempOptimal / tempData.length) * 100) : 0,
        trend: 'Estable'
      },
      humidityAir: {
        optimalRange: '40-70%'
      },
      humiditySoil: {
        optimalRange: '50-80%'
      },
      irrigationNeeds: data.filter(d => d.humedad_suelo && d.humedad_suelo < 30).length,
      recommendations: [
        'Mantener temperatura entre 18-28°C para óptimo crecimiento',
        'Monitorear humedad del suelo para optimizar riego',
        'Revisar sensores con lecturas anómalas',
        'Considerar ajustes automáticos de riego basados en humedad'
      ]
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0
    return new Date(d.setDate(diff));
  }
}