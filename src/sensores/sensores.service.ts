import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { Alerta } from '../alertas/entities/alerta.entity';
import { MqttService } from './services/mqtt.service';

@Injectable()
export class SensoresService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensoresRepository: Repository<Sensor>,
    private readonly mqttService: MqttService,
  ) {}

  async create(createSensorDto: any) {
    const nuevoSensor = this.sensoresRepository.create(createSensorDto);
    return await this.sensoresRepository.save(nuevoSensor);
  }

  async findAll() {
    return await this.sensoresRepository.find();
  }

  async findOne(id: number) {
    const sensor = await this.sensoresRepository.findOne({ where: { id_sensor: id } });
    if (!sensor) {
      throw new NotFoundException(`Sensor con ID ${id} no encontrado.`);
    }
    return sensor;
  }

  async update(id: number, updateSensorDto: any) {
    const sensor = await this.sensoresRepository.findOne({ where: { id_sensor: id } });
    if (!sensor) {
      throw new NotFoundException(`Sensor con ID ${id} no encontrado.`);
    }
    await this.sensoresRepository.update(id, updateSensorDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const sensor = await this.sensoresRepository.findOne({ where: { id_sensor: id } });
    if (!sensor) {
      throw new NotFoundException(`Sensor con ID ${id} no encontrado.`);
    }
    await this.sensoresRepository.delete(id);
  }

  async registrarLectura(id_sensor: number, valor: number, unidad_medida?: string, observaciones?: string) {
    const sensor = await this.findOne(id_sensor);
    
    const historialActual = sensor.historial_lecturas || [];
    
    // Agregar nueva lectura
    const nuevaLectura = {
      valor,
      timestamp: new Date(),
      unidad_medida,
      observaciones
    };
    
    historialActual.push(nuevaLectura);
    
    if (historialActual.length > 1000) {
      historialActual.shift();
    }
    
    await this.sensoresRepository.update(id_sensor, {
      valor_actual: valor,
      ultima_lectura: new Date(),
      historial_lecturas: historialActual
    });

    await this.verificarAlertas(sensor, valor);
    
    return { mensaje: 'Lectura registrada exitosamente', lectura: nuevaLectura };
  }

  async obtenerHistorial(id_sensor: number, limite: number = 100) {
    const sensor = await this.findOne(id_sensor);
    const historial = sensor.historial_lecturas || [];
    
    return historial.slice(-limite).reverse();
  }

  async obtenerDatosTiempoReal(id_sensor?: number) {
    const where = id_sensor ? { id_sensor } : {};
    const sensores = await this.sensoresRepository.find({
      where,
      relations: ['id_sublote']
    });

    return sensores.map(sensor => ({
      id_sensor: sensor.id_sensor,
      tipo_sensor: sensor.tipo_sensor,
      valor_actual: sensor.valor_actual,
      valor_minimo: sensor.valor_minimo,
      valor_maximo: sensor.valor_maximo,
      ultima_lectura: sensor.ultima_lectura,
      estado: sensor.estado,
      sublote: sensor.id_sublote
    }));
  }

  async configurarSensor(id_sensor: number, configuracion: {
    valor_minimo?: number;
    valor_maximo?: number;
    estado?: string;
    configuracion?: string;
  }) {
    await this.sensoresRepository.update(id_sensor, configuracion);
    return this.findOne(id_sensor);
  }

  async generarRecomendaciones(id_sensor: number): Promise<string[]> {
    const sensor = await this.findOne(id_sensor);
    const historial = sensor.historial_lecturas || [];
    
    if (historial.length === 0) {
      return ['No hay datos suficientes para generar recomendaciones'];
    }

    const ultimasLecturas = historial.slice(-10);
    const valorPromedio = ultimasLecturas.reduce((sum, lectura) => sum + lectura.valor, 0) / ultimasLecturas.length;
    
    const recomendaciones: string[] = [];

    switch (sensor.tipo_sensor.toLowerCase()) {
      case 'humedad':
        if (valorPromedio < 30) {
          recomendaciones.push('La humedad del suelo está baja. Considere aumentar el riego.');
        } else if (valorPromedio > 80) {
          recomendaciones.push('La humedad del suelo está muy alta. Reduzca el riego para evitar problemas de hongos.');
        } else {
          recomendaciones.push('Los niveles de humedad están en rango óptimo.');
        }
        break;

      case 'temperatura':
        if (valorPromedio < 15) {
          recomendaciones.push('La temperatura está baja. Considere medidas de protección contra heladas.');
        } else if (valorPromedio > 35) {
          recomendaciones.push('La temperatura está alta. Considere sombreado adicional o riego por aspersión.');
        } else {
          recomendaciones.push('La temperatura está en rango adecuado para el cultivo.');
        }
        break;

      case 'ph':
        if (valorPromedio < 6.0) {
          recomendaciones.push('El pH del suelo está ácido. Considere aplicar cal agrícola.');
        } else if (valorPromedio > 7.5) {
          recomendaciones.push('El pH del suelo está alcalino. Considere aplicar azufre o materia orgánica.');
        } else {
          recomendaciones.push('El pH del suelo está en rango óptimo.');
        }
        break;

      default:
        recomendaciones.push('Monitoree regularmente los valores y compare con los rangos óptimos para su cultivo.');
    }

    return recomendaciones;
  }

  private async verificarAlertas(sensor: Sensor, valor: number) {
    const alertaRepository = this.sensoresRepository.manager.getRepository(Alerta);

    let tipoAlerta = '';
    let descripcion = '';

    if (sensor.valor_minimo !== null && valor < sensor.valor_minimo) {
      tipoAlerta = 'Valor Bajo';
      descripcion = `El sensor ${sensor.tipo_sensor} registró ${valor}, por debajo del mínimo (${sensor.valor_minimo})`;
    } else if (sensor.valor_maximo !== null && valor > sensor.valor_maximo) {
      tipoAlerta = 'Valor Alto';
      descripcion = `El sensor ${sensor.tipo_sensor} registró ${valor}, por encima del máximo (${sensor.valor_maximo})`;
    }

    if (tipoAlerta) {
      const alerta = alertaRepository.create({
        tipo_alerta: tipoAlerta,
        descripcion,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
        sensor: sensor
      });

      await alertaRepository.save(alerta);
    }
  }

  async obtenerDatosGraficos(
    id_sensor: number,
    tipo: 'linea' | 'barra' | 'area' = 'linea',
    periodo: 'hora' | 'dia' | 'semana' | 'mes' = 'dia',
    limite: number = 100
  ) {
    const sensor = await this.findOne(id_sensor);
    const historial = sensor.historial_lecturas || [];

    // Agrupar datos según el período
    const datosAgrupados = this.agruparDatosPorPeriodo(historial, periodo);

    // Limitar resultados
    const datosLimitados = datosAgrupados.slice(-limite);

    return {
      sensor: {
        id_sensor: sensor.id_sensor,
        tipo_sensor: sensor.tipo_sensor,
        ubicacion: sensor.id_sublote
      },
      tipo_grafico: tipo,
      periodo,
      datos: datosLimitados.map((item: any) => ({
        timestamp: item.timestamp,
        valor: item.valor,
        unidad_medida: item.unidad_medida
      }))
    };
  }

  async obtenerTimelineCultivo(
    id_sublote?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
    sensores?: string
  ) {
    let query = this.sensoresRepository.createQueryBuilder('sensor')
      .leftJoinAndSelect('sensor.id_sublote', 'sublote');

    if (id_sublote) {
      query = query.where('sensor.id_sublote = :id_sublote', { id_sublote });
    }

    if (sensores) {
      const tiposSensores = sensores.split(',').map(s => s.trim());
      query = query.andWhere('sensor.tipo_sensor IN (:...tipos)', { tipos: tiposSensores });
    }

    const sensoresEncontrados = await query.getMany();

    const timelineData: any[] = [];

    for (const sensor of sensoresEncontrados) {
      const historial = sensor.historial_lecturas || [];

      // Filtrar por fechas si se proporcionan
      let historialFiltrado = historial;
      if (fecha_inicio || fecha_fin) {
        const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date(0);
        const fin = fecha_fin ? new Date(fecha_fin) : new Date();

        historialFiltrado = historial.filter(lectura => {
          const fechaLectura = new Date(lectura.timestamp);
          return fechaLectura >= inicio && fechaLectura <= fin;
        });
      }

      timelineData.push({
        sensor: {
          id_sensor: sensor.id_sensor,
          tipo_sensor: sensor.tipo_sensor,
          sublote: sensor.id_sublote
        },
        lecturas: historialFiltrado.map(lectura => ({
          timestamp: lectura.timestamp,
          valor: lectura.valor,
          unidad_medida: lectura.unidad_medida,
          observaciones: lectura.observaciones
        }))
      });
    }

    return {
      periodo: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null
      },
      sensores: sensores ? sensores.split(',').map(s => s.trim()) : null,
      datos: timelineData
    };
  }

  async obtenerEstadisticasGenerales(id_sublote?: number, tipo_sensor?: string) {
    let query = this.sensoresRepository.createQueryBuilder('sensor')
      .leftJoinAndSelect('sensor.id_sublote', 'sublote');

    if (id_sublote) {
      query = query.where('sensor.id_sublote = :id_sublote', { id_sublote });
    }

    if (tipo_sensor) {
      query = query.andWhere('sensor.tipo_sensor = :tipo_sensor', { tipo_sensor });
    }

    const sensores = await query.getMany();

    const estadisticas = {
      total_sensores: sensores.length,
      tipos_sensores: {},
      resumen_por_sensor: [] as any[]
    };

    for (const sensor of sensores) {
      const historial = sensor.historial_lecturas || [];

      if (historial.length > 0) {
        const valores = historial.map(h => h.valor);
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
        const minimo = Math.min(...valores);
        const maximo = Math.max(...valores);

        estadisticas.resumen_por_sensor.push({
          sensor: {
            id_sensor: sensor.id_sensor,
            tipo_sensor: sensor.tipo_sensor,
            sublote: sensor.id_sublote
          },
          estadisticas: {
            total_lecturas: historial.length,
            promedio,
            minimo,
            maximo,
            ultima_lectura: sensor.ultima_lectura,
            valor_actual: sensor.valor_actual
          }
        });

        // Contar tipos de sensores
        if (!estadisticas.tipos_sensores[sensor.tipo_sensor]) {
          estadisticas.tipos_sensores[sensor.tipo_sensor] = 0;
        }
        estadisticas.tipos_sensores[sensor.tipo_sensor]++;
      }
    }

    return estadisticas;
  }

  async configurarMqtt(sensorId: number, config: {
    mqtt_host?: string;
    mqtt_port?: number;
    mqtt_topic?: string;
    mqtt_username?: string;
    mqtt_password?: string;
    mqtt_enabled?: boolean;
    mqtt_client_id?: string;
  }) {
    return await this.mqttService.configureSensorMqtt(sensorId, config);
  }

  async obtenerEstadoMqtt(sensorId: number) {
    const sensor = await this.findOne(sensorId);
    const conectado = this.mqttService.isSensorConnected(sensorId);

    return {
      sensor: {
        id_sensor: sensor.id_sensor,
        tipo_sensor: sensor.tipo_sensor
      },
      mqtt_config: {
        host: sensor.mqtt_host,
        port: sensor.mqtt_port,
        topic: sensor.mqtt_topic,
        username: sensor.mqtt_username ? 'configurado' : null,
        enabled: sensor.mqtt_enabled,
        client_id: sensor.mqtt_client_id
      },
      estado: {
        conectado,
        ultima_conexion: sensor.updated_at
      }
    };
  }

  private agruparDatosPorPeriodo(historial: any[], periodo: string) {
    const grupos: { [key: string]: any[] } = {};

    historial.forEach(lectura => {
      const fecha = new Date(lectura.timestamp);
      let clave: string;

      switch (periodo) {
        case 'hora':
          clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}-${fecha.getHours()}`;
          break;
        case 'dia':
          clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
          break;
        case 'semana':
          const semanaInicio = new Date(fecha);
          semanaInicio.setDate(fecha.getDate() - fecha.getDay());
          clave = `${semanaInicio.getFullYear()}-${semanaInicio.getMonth()}-${semanaInicio.getDate()}`;
          break;
        case 'mes':
          clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
          break;
        default:
          clave = fecha.toISOString().split('T')[0];
      }

      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(lectura);
    });

    // Calcular promedios por grupo
    const resultado: any[] = [];
    for (const [clave, lecturas] of Object.entries(grupos)) {
      const valores = lecturas.map(l => l.valor);
      const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

      resultado.push({
        timestamp: clave,
        valor: promedio,
        unidad_medida: lecturas[0]?.unidad_medida,
        cantidad_lecturas: lecturas.length
      });
    }

    return resultado.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
  }

  async registrarServidorMqtt(servidor: {
    nombre: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    descripcion?: string;
  }) {
    // Aquí podríamos crear una tabla separada para servidores MQTT
    // Por ahora, devolveremos un ID simulado
    const servidorId = Date.now(); // ID temporal
    return {
      id: servidorId,
      ...servidor,
      fecha_creacion: new Date()
    };
  }

  async obtenerServidoresMqtt() {
    // Aquí consultaríamos la tabla de servidores MQTT
    // Por ahora, devolveremos una lista vacía
    return [];
  }

  async asignarSensorAServidor(id_servidor: number, id_sensor: number, config: {
    topic: string;
    client_id?: string;
  }) {
    const sensor = await this.findOne(id_sensor);

    // Actualizar configuración MQTT del sensor
    await this.update(id_sensor, {
      mqtt_topic: config.topic,
      mqtt_client_id: config.client_id || `sensor_${id_sensor}`,
      mqtt_enabled: true
    });

    return {
      mensaje: 'Sensor asignado al servidor MQTT exitosamente',
      sensor_id: id_sensor,
      servidor_id: id_servidor,
      topic: config.topic,
      client_id: config.client_id || `sensor_${id_sensor}`
    };
  }

  async probarConexionServidor(id_servidor: number) {
    // Aquí implementaríamos la lógica para probar la conexión MQTT
    // Por ahora, simularemos una conexión exitosa
    return {
      servidor_id: id_servidor,
      conectado: true,
      mensaje: 'Conexión exitosa al servidor MQTT'
    };
  }

  async inicializarConexionesMqtt() {
    try {
      await this.mqttService.initializeConnectionsOnDemand();
      return {
        mensaje: 'Conexiones MQTT inicializadas exitosamente',
        sensores_conectados: this.mqttService.getConnectedSensors().length
      };
    } catch (error) {
      throw new BadRequestException(`Error al inicializar conexiones MQTT: ${error.message}`);
    }
  }
}
