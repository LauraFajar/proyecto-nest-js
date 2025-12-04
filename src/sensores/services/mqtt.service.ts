import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { SensoresGateway } from '../sensores.gateway';
import { Sensor } from '../entities/sensor.entity';
import { SensoresService } from '../sensores.service';
import { IotGateway } from '../../iot/services/iot.gateway';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: MqttClient | null = null;
  private logger = new Logger('MqttService');
  private sensorConnections: Map<number, boolean> = new Map();
  private genericTopics: Set<string> = new Set();
  private genericMessageHandlerInstalled = false;

  constructor(
    private readonly sensoresGateway: SensoresGateway,
    @Inject(forwardRef(() => SensoresService))
    private readonly sensoresService: SensoresService,
    private readonly iotGateway: IotGateway,
  ) {}

  onModuleInit() {
    this.connect();
  }

  connect() {
    const enabled = String(process.env.MQTT_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) {
      this.logger.log('MQTT deshabilitado (MQTT_ENABLED != "true"), no se intentará conectar.');
      return;
    }

    const url = 'mqtt://broker.hivemq.com:1883';

    const reconnectMs = parseInt(process.env.MQTT_RECONNECT_MS || '5000', 10);

    this.client = connect(url, {
      reconnectPeriod: Number.isFinite(reconnectMs) ? reconnectMs : 5000,
    });

    this.client.on('connect', async () => {
      this.logger.log(`Conectado al broker MQTT en ${url}`);
      const autoTopicsRaw = 'luixxa/dht11';

      const autoTopics = autoTopicsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (autoTopics.length) {
        this.logger.log(`Suscripción automática a topics: ${autoTopics.join(', ')}`);
        for (const t of autoTopics) {
          try {
            this.subscribeTopic(t);
          } catch (e) {
            this.logger.warn(`No se pudo suscribir automáticamente al topic ${t}: ${e}`);
          }
        }
      }

      // Inicializa conexiones de sensores bajo demanda si está habilitado
      const autoInitSensors = String(process.env.MQTT_AUTO_INIT_SENSORS || '').toLowerCase() === 'true';
      if (autoInitSensors) {
        try {
          await this.sensoresService.inicializarConexionesMqtt();
          this.logger.log('Inicialización automática de conexiones MQTT para sensores completada.');
        } catch (e) {
          this.logger.warn(`Fallo al inicializar conexiones MQTT de sensores: ${e}`);
        }
      }

      this.ensureGenericMessageHandler();
    });

    this.client.on('reconnect', () => {
      this.logger.warn(`Reintentando conexión al broker MQTT en ${url}...`);
    });

    this.client.on('offline', () => {
      this.logger.warn('Cliente MQTT en estado offline.');
    });

    this.client.on('close', () => {
      this.logger.warn('Conexión MQTT cerrada.');
    });

    this.client.on('error', (err) => {
      this.logger.warn(`MQTT no disponible en ${url}. Se reintentará cada ${reconnectMs}ms.`);
      this.logger.debug(err?.message || String(err));
    });
  }

  private ensureGenericMessageHandler() {
    if (!this.client || this.genericMessageHandlerInstalled) return;
    this.client.on('message', async (topic, message) => {
      try {
        const payload = message.toString();
        this.logger.log(`📩 Mensaje recibido en ${topic}: ${payload}`);
  
        let data: any;
  
        try {
          data = JSON.parse(payload);
        } catch {
          this.logger.warn('⚠ El mensaje no es JSON válido. Se ignora.');
          return;
        }
  
        // Emitir datos completos del MQTT para que el frontend los reciba
        const completeReading = {
          deviceId: topic.split('/').pop() || 'dht11',
          topic: topic,
          timestamp: new Date(),
          temperatura: data.temperatura,
          humedad_aire: data.humedad_aire,
          humedad_suelo_adc: data.humedad_suelo_adc,
          bomba_estado: data.bomba_estado,
          temperature: data.temperatura,
          humidity: data.humedad_aire,
          soilHumidity: data.humedad_suelo_adc,
          pumpState: data.bomba_estado,
          value: data.temperatura || data.humedad_aire || 0,
        };
        
        this.iotGateway.emitNewReading(completeReading);
        
        if (data.temperatura !== undefined) {
          const valor = Number(data.temperatura);
          this.sensoresGateway.emitLecturaGeneric(topic, {
            valor,
            timestamp: new Date().toISOString(),
            tipo: 'temperatura',
            unidad: '°C'
          });
        }
  
        if (data.humedad_aire !== undefined) {
          const valor = Number(data.humedad_aire);
          this.sensoresGateway.emitLecturaGeneric(topic, {
            valor,
            timestamp: new Date().toISOString(),
            tipo: 'humedad_aire',
            unidad: '%'
          });
        }
  
        if (data.humedad_suelo_adc !== undefined) {
          const adcValue = Number(data.humedad_suelo_adc);
          const porcentajeHumedad = this.convertAdcToPercentGeneric(adcValue);
          
          this.sensoresGateway.emitLecturaGeneric(topic, {
            valor: porcentajeHumedad,
            timestamp: new Date().toISOString(),
            tipo: 'humedad_suelo_porcentaje',
            unidad: '%'
          });
        }
  
        if (data.bomba_estado !== undefined) {
          this.sensoresGateway.emitLecturaGeneric(topic, {
            valor: data.bomba_estado === 'ENCENDIDA' ? 1 : 0,
            timestamp: new Date().toISOString(),
            tipo: 'bomba_estado',
            unidad: data.bomba_estado === 'ENCENDIDA' ? 'ON' : 'OFF'
          });
        }
  
      } catch (e) {
        this.logger.error('❌ Error procesando mensaje MQTT', e);
      }
    });
    this.genericMessageHandlerInstalled = true;
  }

  subscribeTopic(topic: string) {
    if (!this.client) {
      this.logger.warn('Cliente MQTT no inicializado; suscripción omitida.');
      return;
    }
    if (!topic || !topic.trim()) {
      this.logger.warn('Topic vacío; suscripción omitida.');
      return;
    }
    try {
      this.ensureGenericMessageHandler();
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Error al suscribirse a ${topic}`, err);
          return;
        }
        this.genericTopics.add(topic);
        this.logger.log(`Suscrito a topic genérico: ${topic}`);
      });
    } catch (e) {
      this.logger.error(`Fallo suscribiendo topic ${topic}`, e as any);
    }
  }
  
  unsubscribeTopic(topic: string) {
    if (!this.client) {
      this.logger.warn('Cliente MQTT no inicializado; desuscripción omitida.');
      return;
    }
    if (!topic || !topic.trim()) {
      this.logger.warn('Topic vacío; desuscripción omitida.');
      return;
    }
    try {
      this.client.unsubscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Error al desuscribirse de ${topic}`, err);
          return;
        }
        this.genericTopics.delete(topic);
        this.logger.log(`Desuscrito de topic genérico: ${topic}`);
      });
    } catch (e) {
      this.logger.error(`Fallo desuscribiendo topic ${topic}`, e as any);
    }
  }

  private extractFromGenericPayload(payloadObj: any | null, rawPayload: string): { valor: number | null; unidad?: string } {
    const direct = parseFloat(rawPayload);
    if (!Number.isNaN(direct) && !payloadObj) {
      return { valor: direct };
    }
    if (payloadObj && typeof payloadObj === 'object') {
      const tryKeys = (keys: string[]) => {
        for (const k of keys) {
          if (k in payloadObj) {
            const v = parseFloat(payloadObj[k]);
            if (!Number.isNaN(v)) return v;
          }
        }
        return null;
      };
      let v = tryKeys(['temperatura', 'temperature', 'temp']);
      if (v !== null) return { valor: v, unidad: '°C' };
      v = tryKeys(['humedad_aire', 'humidity', 'humedadAmbiente']);
      if (v !== null) return { valor: v, unidad: '%' };
      v = tryKeys(['humedad_suelo', 'soil_moisture']);
      if (v !== null) return { valor: v, unidad: '%' };
      v = tryKeys(['valor', 'value']);
      if (v !== null) return { valor: v };
    }
    return { valor: null };
  }


  subscribe(sensor: Sensor) {
    if (!this.client) {
      this.logger.warn('Cliente MQTT no inicializado; suscripción omitida.');
      return;
    }
    if (!sensor.mqtt_topic) {
      this.logger.warn(`Sensor ${sensor.id_sensor} no tiene mqtt_topic`);
      return;
    }

    this.client.subscribe(sensor.mqtt_topic, (err) => {
      if (err) {
        this.logger.error(`Error al suscribirse a ${sensor.mqtt_topic}`, err);
        return;
      }
      this.logger.log(`Suscrito a ${sensor.mqtt_topic} para sensor ${sensor.id_sensor}`);
      this.sensorConnections.set(sensor.id_sensor, true);
      this.sensoresGateway.emitEstado(sensor.id_sensor, true);
    });

    this.client.on('message', async (topic, message) => {
      try {
        if (topic !== sensor.mqtt_topic) return;
        const payloadStr = message.toString();
        const nowIso = new Date().toISOString();

        // Intentar parsear JSON con múltiples métricas
        let payloadObj: any | null = null;
        try {
          payloadObj = JSON.parse(payloadStr);
        } catch (e) {
          payloadObj = null;
        }

        // Determinar valor según tipo de sensor
        const valor = this.extractValorFromPayload(sensor, payloadObj, payloadStr);
        if (valor !== null && valor !== undefined && !Number.isNaN(valor)) {
          await this.sensoresService.updateSensorReading(sensor.id_sensor, valor);
          this.sensoresGateway.emitLectura(sensor.id_sensor, {
            valor,
            timestamp: nowIso,
            unidad_medida: this.getUnidad(sensor),
          });
        }

        // Emitir estado de bomba si viene en el payload
        if (payloadObj && typeof payloadObj === 'object' && 'bomba_estado' in payloadObj) {
          this.sensoresGateway.emitBombaEstado({
            estado: String(payloadObj['bomba_estado']),
            timestamp: nowIso,
            sensorId: sensor.id_sensor,
          });
        }

        // Marcar conexión activa
        this.sensorConnections.set(sensor.id_sensor, true);
        this.sensoresGateway.emitEstado(sensor.id_sensor, true);
      } catch (err) {
        this.logger.error(`Error procesando mensaje para sensor ${sensor.id_sensor}: ${err}`);
      }
    });
  }

  publish(topic: string, payload: string | Buffer) {
    if (!this.client) {
      this.logger.warn('Cliente MQTT no inicializado; publicación omitida.');
      return;
    }
    this.client.publish(topic, payload);
  }

  isSensorConnected(sensorId: number): boolean {
    return this.sensorConnections.get(sensorId) || false;
  }

  private extractValorFromPayload(sensor: Sensor, payloadObj: any | null, rawPayload: string): number | null {
    const tipo = (sensor.tipo_sensor || '').toLowerCase();

    const direct = parseFloat(rawPayload);
    if (!Number.isNaN(direct) && !payloadObj) {
      if (tipo.includes('suelo') || tipo.includes('tierra')) {
        if (direct >= 0 && direct <= 100) {
          return direct;
        }
        return this.convertAdcToPercent(sensor, direct);
      }
      return direct;
    }

    if (payloadObj && typeof payloadObj === 'object') {
      if (tipo.includes('temperatura')) {
        const keys = ['temperatura', 'temperature', 'temp'];
        for (const k of keys) {
          if (k in payloadObj && this.isNumberLike(payloadObj[k])) return parseFloat(payloadObj[k]);
        }
      }

      if (tipo.includes('humedad') && !tipo.includes('suelo')) {
        const keys = ['humedad_aire', 'humidity', 'humedadAmbiente'];
        for (const k of keys) {
          if (k in payloadObj && this.isNumberLike(payloadObj[k])) return parseFloat(payloadObj[k]);
        }
      }

      if (tipo.includes('suelo') || tipo.includes('tierra')) {
        const percentKeys = ['humedad_suelo', 'soil_moisture'];
        for (const k of percentKeys) {
          if (k in payloadObj && this.isNumberLike(payloadObj[k])) return parseFloat(payloadObj[k]);
        }
        const adcKeys = ['humedad_suelo_adc', 'soil_moisture_adc'];
        for (const k of adcKeys) {
          if (k in payloadObj && this.isNumberLike(payloadObj[k])) {
            const adc = parseFloat(payloadObj[k]);
            return this.convertAdcToPercent(sensor, adc);
          }
        }
        const genericKeys = ['valor', 'value'];
        for (const k of genericKeys) {
          if (k in payloadObj && this.isNumberLike(payloadObj[k])) {
            const v = parseFloat(payloadObj[k]);
            return v <= 100 ? v : this.convertAdcToPercent(sensor, v);
          }
        }
      }
    }

    return null;
  }

  private isNumberLike(v: any): boolean {
    const n = parseFloat(v);
    return !Number.isNaN(n) && Number.isFinite(n);
  }

  private getUnidad(sensor: Sensor): string | undefined {
    const tipo = (sensor.tipo_sensor || '').toLowerCase();
    if (tipo.includes('temperatura')) return '°C';
    if (tipo.includes('humedad') && !tipo.includes('suelo')) return '%';
    if (tipo.includes('suelo') || tipo.includes('tierra')) return '%';
    return undefined;
  }

  private convertAdcToPercent(sensor: Sensor, adc: number): number {
    // Leer calibración desde configuracion JSON del sensor si existe
    let adcWet: number | undefined;
    let adcDry: number | undefined;
    try {
      if (sensor.configuracion) {
        const cfg = JSON.parse(sensor.configuracion);
        if (this.isNumberLike(cfg.adc_wet)) adcWet = parseFloat(cfg.adc_wet);
        if (this.isNumberLike(cfg.adc_dry)) adcDry = parseFloat(cfg.adc_dry);
      }
    } catch {}

    // Autodetección de rango si no hay calibración
    if (adcWet === undefined || adcDry === undefined) {
      if (adc > 4095) {
        // Supone ADC de 16 bits si el valor supera 12 bits
        adcDry = adcDry ?? 65535;
        adcWet = adcWet ?? 0;
      } else {
        // Supone ADC de 12 bits
        adcDry = adcDry ?? 4095;
        adcWet = adcWet ?? 0;
      }
    }

    // Asegurar rangos válidos
    if (adcWet === adcDry) adcDry = (adcWet as number) + 1;

    let percent = (((adcDry as number) - adc) / ((adcDry as number) - (adcWet as number))) * 100;
    percent = Math.max(0, Math.min(100, percent));
    return parseFloat(percent.toFixed(2));
  }

  // Versión genérica para conversión sin objeto sensor
  private convertAdcToPercentGeneric(adc: number): number {
    // Auto-detección de rango ADC
    let adcMax: number;
    if (adc > 4095) {
      // ADC de 16 bits
      adcMax = 65535;
    } else if (adc > 1023) {
      // ADC de 12 bits
      adcMax = 4095;
    } else {
      // ADC de 10 bits
      adcMax = 1023;
    }
    
    // Conversión estándar: humedad = ((valor_maximo - valor_actual) / valor_maximo) * 100
    let percent = ((adcMax - adc) / adcMax) * 100;
    
    // Limitar [0, 100]
    percent = Math.max(0, Math.min(100, percent));
    return parseFloat(percent.toFixed(2));
  }

  async configureSensorMqtt(sensorId: number, config: Partial<Sensor>): Promise<boolean> {
    try {
      await this.sensoresService.update(sensorId, config);
      const sensor = await this.sensoresService.findOne(sensorId)
      if (sensor && sensor.mqtt_enabled && sensor.mqtt_topic) {
        this.subscribe(sensor as Sensor)
      }
      this.logger.log(`MQTT configurado para sensor ${sensorId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error configurando MQTT para sensor ${sensorId}`, error);
      return false;
    }
  }

  async initializeConnectionsOnDemand(): Promise<void> {
    try {
      const sensores = await this.sensoresService.findAll();
      for (const sensor of sensores) {
        if (sensor.mqtt_enabled && sensor.mqtt_topic) {
          this.subscribe(sensor);
        }
      }
      this.logger.log('Conexiones MQTT inicializadas bajo demanda');
    } catch (error) {
      this.logger.error('Error inicializando conexiones MQTT bajo demanda', error);
      throw error;
    }
  }

  getConnectedSensors(): number[] {
    return Array.from(this.sensorConnections.entries())
      .filter(([_, connected]) => !!connected)
      .map(([id]) => id);
  }

  private extractMetricsFromGenericPayload(payloadObj: any | null, rawPayload: string): Array<{ valor: number | null; unidad?: string; observaciones: string }> {
    const metrics: Array<{ valor: number | null; unidad?: string; observaciones: string }> = [];

    const direct = parseFloat(rawPayload);
    if (!Number.isNaN(direct) && !payloadObj) {
      metrics.push({ valor: direct, observaciones: 'generico' });
      return metrics;
    }

    if (payloadObj && typeof payloadObj === 'object') {
      const pickNumber = (key: string): number | null => {
        if (key in payloadObj && this.isNumberLike(payloadObj[key])) return parseFloat(payloadObj[key]);
        return null;
      };

      const temp = pickNumber('temperatura') ?? pickNumber('temperature') ?? pickNumber('temp');
      if (temp !== null) metrics.push({ valor: temp, unidad: '°C', observaciones: 'temperatura' });

      const ha = pickNumber('humedad_aire') ?? pickNumber('humidity') ?? pickNumber('humedadAmbiente');
      if (ha !== null) metrics.push({ valor: ha, unidad: '%', observaciones: 'humedad_aire' });

      const hsPercent = pickNumber('humedad_suelo') ?? pickNumber('soil_moisture');
      if (hsPercent !== null) metrics.push({ valor: hsPercent, unidad: '%', observaciones: 'humedad_suelo' });
      else {
        const hsAdc = pickNumber('humedad_suelo_adc') ?? pickNumber('soil_moisture_adc');
        if (hsAdc !== null) {
          const porcentaje = this.convertAdcToPercentGeneric(hsAdc);
          metrics.push({ valor: porcentaje, unidad: '%', observaciones: 'humedad_suelo' });
        }
      }

      const generic = pickNumber('valor') ?? pickNumber('value');
      if (generic !== null) metrics.push({ valor: generic, observaciones: 'generico' });
    }

    return metrics.length ? metrics : [{ valor: null, observaciones: 'generico' }];
  }

  private extractPumpState(payloadObj: any | null): string | null {
    if (!payloadObj || typeof payloadObj !== 'object') return null;
    const candidates = ['bomba_estado', 'pump_state', 'pump', 'bomba', 'relay', 'estado_bomba', 'bombaEstado', 'pumpOn'];
    for (const k of candidates) {
      if (k in payloadObj) {
        const v = payloadObj[k];
        if (typeof v === 'string') {
          const s = v.toLowerCase();
          if (['on', 'encendida', 'true', '1', 'activo', 'activa'].includes(s)) return 'on';
          if (['off', 'apagada', 'false', '0', 'inactivo', 'inactiva'].includes(s)) return 'off';
          // Si viene "1"/"0"
          if (s === '1') return 'on';
          if (s === '0') return 'off';
        } else if (typeof v === 'number') {
          return v !== 0 ? 'on' : 'off';
        } else if (typeof v === 'boolean') {
          return v ? 'on' : 'off';
        }
      }
    }
    return null;
  }
}