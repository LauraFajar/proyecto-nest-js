import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { Alerta } from '../alertas/entities/alerta.entity';

@Injectable()
export class SensoresService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensoresRepository: Repository<Sensor>,
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

  // Funcionalidades IoT usando entidad Sensor existente
  async registrarLectura(id_sensor: number, valor: number, unidad_medida?: string, observaciones?: string) {
    const sensor = await this.findOne(id_sensor);
    
    // Obtener historial actual o inicializar array vacío
    const historialActual = sensor.historial_lecturas || [];
    
    // Agregar nueva lectura
    const nuevaLectura = {
      valor,
      timestamp: new Date(),
      unidad_medida,
      observaciones
    };
    
    historialActual.push(nuevaLectura);
    
    // Mantener solo las últimas 1000 lecturas para optimizar performance
    if (historialActual.length > 1000) {
      historialActual.shift();
    }
    
    // Actualizar sensor con nueva lectura y historial
    await this.sensoresRepository.update(id_sensor, {
      valor_actual: valor,
      ultima_lectura: new Date(),
      historial_lecturas: historialActual
    });

    // Verificar alertas
    await this.verificarAlertas(sensor, valor);
    
    return { mensaje: 'Lectura registrada exitosamente', lectura: nuevaLectura };
  }

  async obtenerHistorial(id_sensor: number, limite: number = 100) {
    const sensor = await this.findOne(id_sensor);
    const historial = sensor.historial_lecturas || [];
    
    // Retornar las últimas 'limite' lecturas
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
        id_sensor: sensor,
        leida: false,
        enviada_email: false,
        datos_adicionales: { valor, limite: sensor.valor_minimo || sensor.valor_maximo }
      });

      await alertaRepository.save(alerta);
    }
  }
}
