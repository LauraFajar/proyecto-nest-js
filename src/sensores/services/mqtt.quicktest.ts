import { MqttService } from './mqtt.service';
import { Sensor } from '../entities/sensor.entity';

// Mocks mínimos para constructor
class DummyGateway {
  emitEstado() {}
  emitLectura() {}
  emitBombaEstado() {}
  emitLecturaGeneric() {}
}
class DummySensoresService {
  updateSensorReading() { return Promise.resolve(); }
  update() { return Promise.resolve(); }
  findOne() { return Promise.resolve(null); }
  findAll() { return Promise.resolve([]); }
}
class DummyIotGateway {
  emitNewReading() {}
}

(async () => {
  const gateway = new DummyGateway() as any;
  const service = new DummySensoresService() as any;
  const iotGateway = new DummyIotGateway() as any;
  const mqtt = new MqttService(gateway, service);

  const sensor: Partial<Sensor> = {
    id_sensor: 1,
    tipo_sensor: 'Humedad del Suelo',
    configuracion: undefined,
  };

  const s = sensor as Sensor;

  // Acceso a métodos privados para prueba rápida
  const extract = (mqtt as any).extractValorFromPayload.bind(mqtt);
  const convert = (mqtt as any).convertAdcToPercent.bind(mqtt);

  const adc16 = 50000;
  const percent16 = convert(s, adc16);
  console.log('ADC16 50000 -> %', percent16);

  const percentDirect = extract(s, null, '85');
  console.log('Direct 85 -> %', percentDirect);

  const jsonPayload = { soil_moisture_adc: 3000 };
  const jsonPercent = extract(s, jsonPayload, JSON.stringify(jsonPayload));
  console.log('JSON ADC3000 -> %', jsonPercent);

  const percentFromRawAdc = extract(s, null, String(adc16));
  console.log('Raw 50000 -> %', percentFromRawAdc);
})();