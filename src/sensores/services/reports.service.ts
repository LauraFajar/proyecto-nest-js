import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import PDFDocument from 'pdfkit';
import { Lectura } from '../entities/lectura.entity';
import { Sensor } from '../entities/sensor.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';

export type MetricKey = 'temperatura' | 'humedad_aire' | 'humedad_suelo_adc' | 'humedad_suelo_porcentaje' | 'bomba_estado';

function normalizeMetric(metric?: string): MetricKey | undefined {
  if (!metric) return undefined;
  const m = metric.toLowerCase().trim();
  if (m === 'humedad') return 'humedad_aire';
  if (m === 'temperatura') return 'temperatura';
  if (m === 'humedad_aire') return 'humedad_aire';
  if (m === 'humedad_suelo_adc' || m === 'humedad_suelo') return 'humedad_suelo_porcentaje'; 
  if (m === 'humedad_suelo_porcentaje') return 'humedad_suelo_porcentaje';
  if (m === 'bomba_estado' || m === 'bomba') return 'bomba_estado';
  return undefined;
}

// Función para convertir valores ADC de humedad del suelo a porcentaje
function convertirHumedadSuelo(valor: number): number {
  const valorMaximo = valor > 2000 ? 4095 : 1023;
  
  // Conversión a porcentaje
  const humedadPorcentaje = ((valorMaximo - valor) / valorMaximo) * 100;
  
  return Math.max(0, Math.min(100, humedadPorcentaje));
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(
    @InjectRepository(Lectura) private readonly lecturaRepo: Repository<Lectura>,
    @InjectRepository(Sensor) private readonly sensorRepo: Repository<Sensor>,
    @InjectRepository(Sublote) private readonly subloteRepo: Repository<Sublote>,
    @InjectRepository(Cultivo) private readonly cultivoRepo: Repository<Cultivo>,
  ) {}

  async obtenerLecturasPorTopic(topic: string, options?: { metric?: string; desde?: Date; hasta?: Date; order?: 'ASC' | 'DESC'; limit?: number }) {
    if (!topic) throw new BadRequestException('El parámetro "topic" es obligatorio.');
    
    try {
      const qbLecturas = this.lecturaRepo.createQueryBuilder('l')
        .where('l.mqtt_topic = :topic', { topic: topic })
        .andWhere('l.unidad_medida = :metric OR :metric IS NULL', { metric: options?.metric });

      if (options?.desde) {
        qbLecturas.andWhere('l.fecha >= :desde', { desde: options.desde });
      }
      if (options?.hasta) {
        qbLecturas.andWhere('l.fecha <= :hasta', { hasta: options.hasta });
      }

      const countLecturas = await qbLecturas.getCount();
      
      if (countLecturas === 0) {
        this.logger.warn(`⚠️ No se encontraron lecturas reales para el topic: ${topic}.`);
        return [];
      }
      qbLecturas.orderBy('l.fecha', options?.order === 'DESC' ? 'DESC' : 'ASC');
      
      if (options?.limit && options.limit > 0) {
        qbLecturas.take(options.limit);
      }

      const lecturas = await qbLecturas.getMany();

      const metric = normalizeMetric(options?.metric);
      let lecturasFiltradas = lecturas;

      if (metric) {
        lecturasFiltradas = lecturas.filter((lectura: any) => 
          lectura.unidad_medida === metric ||
          (metric === 'temperatura' && lectura.unidad_medida?.includes('temperatura')) ||
          (metric === 'humedad_aire' && lectura.unidad_medida?.includes('humedad_aire')) ||
          (metric === 'humedad_suelo_porcentaje' && lectura.unidad_medida?.includes('suelo')) ||
          (metric === 'bomba_estado' && lectura.unidad_medida?.includes('bomba'))
        );
      }

      return lecturasFiltradas.map((lectura: any) => ({
        id_lectura: lectura.id_lectura,
        fecha: lectura.fecha,
        valor: lectura.valor,
        unidad_medida: lectura.unidad_medida || metric || 'desconocido',
        observaciones: lectura.observaciones || 'Lectura real desde MQTT',
        mqtt_topic: topic
      }));

    } catch (error) {
      this.logger.error('Error obteniendo lecturas por topic:', error);
      return [];
    }
  }



  calcularResumen(lecturas: Lectura[]) {
    if (!lecturas.length) {
      return { count: 0, avg: null, min: null, max: null };
    }
    
    const values = lecturas.map((l) => {
      const valor = Number(l.valor);
      if (!Number.isFinite(valor)) return null;
      
      if (l.unidad_medida === 'humedad_suelo_adc') {
        return convertirHumedadSuelo(valor);
      }
      
      return valor;
    }).filter((v) => v !== null);
    
    if (!values.length) return { count: 0, avg: null, min: null, max: null };
    const count = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { count, avg, min, max };
  }

  contarActivacionesBomba(lecturas: Lectura[]) {
    const bombaLecturas = lecturas.filter((l) => l.unidad_medida === 'bomba_estado').sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    let activaciones = 0;
    for (let i = 1; i < bombaLecturas.length; i++) {
      const prev = Number(bombaLecturas[i - 1].valor);
      const curr = Number(bombaLecturas[i].valor);
      if (prev === 0 && curr === 1) activaciones++;
    }
    return activaciones;
  }

  resumenSemanal(lecturas: Lectura[]) {
    const byWeek: Record<string, { fechaInicio: Date; count: number; sum: number; min: number; max: number }> = {};
    const numericLecturas = lecturas.filter((l) => Number.isFinite(Number(l.valor)));
    for (const l of numericLecturas) {
      const d = new Date(l.fecha);
      const day = (d.getDay() + 6) % 7; 
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - day);
      const key = start.toISOString().slice(0, 10);
      if (!byWeek[key]) {
        byWeek[key] = { fechaInicio: start, count: 0, sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
      }
      const v = Number(l.valor);
      byWeek[key].count += 1;
      byWeek[key].sum += v;
      byWeek[key].min = Math.min(byWeek[key].min, v);
      byWeek[key].max = Math.max(byWeek[key].max, v);
    }
    return Object.keys(byWeek)
      .sort()
      .map((k) => ({
        semana_inicio: byWeek[k].fechaInicio,
        cantidad: byWeek[k].count,
        promedio: byWeek[k].count ? byWeek[k].sum / byWeek[k].count : null,
        minimo: byWeek[k].min === Number.POSITIVE_INFINITY ? null : byWeek[k].min,
        maximo: byWeek[k].max === Number.NEGATIVE_INFINITY ? null : byWeek[k].max,
      }));
  }

  async buildExcelPorTopic(topic: string, metric?: string, desde?: Date, hasta?: Date) {
    const metricNorm = normalizeMetric(metric);
    const lecturas = await this.obtenerLecturasPorTopic(topic, { metric: metricNorm, desde, hasta });

    const workbook = new Workbook();
    const wsDatos = workbook.addWorksheet('Datos');
    wsDatos.columns = [
      { header: 'Fecha', key: 'fecha', width: 24 },
      { header: 'Métrica', key: 'metric', width: 18 },
      { header: 'Valor', key: 'valor', width: 12 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
    ];
    lecturas.forEach((l) => {
      let valor = Number(l.valor);
      if (l.unidad_medida === 'humedad_suelo_adc') {
        valor = convertirHumedadSuelo(valor);
      }
      wsDatos.addRow({
        fecha: l.fecha,
        metric: l.unidad_medida === 'humedad_suelo_adc' ? 'humedad_suelo_porcentaje' : (l.unidad_medida ?? ''),
        valor: valor,
        observaciones: l.observaciones ?? '',
      });
    });

    const resumen = this.calcularResumen(lecturas as any[]);
    const wsResumen = workbook.addWorksheet('Resumen');
    wsResumen.addRow(['Topic', topic]);
    wsResumen.addRow(['Métrica', metricNorm ?? 'todas']);
    wsResumen.addRow(['Cantidad', resumen.count]);
    wsResumen.addRow(['Promedio', resumen.avg ?? '—']);
    wsResumen.addRow(['Mínimo', resumen.min ?? '—']);
    wsResumen.addRow(['Máximo', resumen.max ?? '—']);

    const semanal = this.resumenSemanal(lecturas as any[]);
    wsResumen.addRow([]);
    wsResumen.addRow(['Semana inicio', 'Cantidad', 'Promedio', 'Mínimo', 'Máximo']);
    for (const w of semanal) {
      wsResumen.addRow([w.semana_inicio, w.cantidad, w.promedio ?? '—', w.minimo ?? '—', w.maximo ?? '—']);
    }

    const wsAnalisis = workbook.addWorksheet('Análisis Estadístico');
    
    wsAnalisis.addRow(['ANÁLISIS ESTADÍSTICO AVANZADO']);
    wsAnalisis.addRow(['Métrica:', metricNorm || 'Todas']);
    wsAnalisis.addRow([]);
    
    // Análisis de tendencia
    const valores = lecturas.map(l => Number(l.valor));
    const tendencia = this.calcularTendencia(valores);
    wsAnalisis.addRow(['Tendencia:', tendencia]);
    
    // Estadísticas básicas
    const resumenEstadistico = this.calcularResumen(lecturas as any[]);
    wsAnalisis.addRow(['Promedio:', resumenEstadistico.avg?.toFixed(2) || '—']);
    wsAnalisis.addRow(['Desviación Estándar:', this.calcularDesviacionEstandar(valores)?.toFixed(2) || '—']);
    wsAnalisis.addRow(['Coeficiente de Variación:', this.calcularCoeficienteVariacion(valores)?.toFixed(2) + '%' || '—']);
    wsAnalisis.addRow([]);
    
    wsAnalisis.addRow(['PROMEDIO MÓVIL DE 7 DÍAS']);
    wsAnalisis.addRow(['Fecha', 'Valor Real', 'Promedio Móvil 7D']);
    const promedioMovil = this.calcularPromedioMovil(lecturas as any[], 7);
    promedioMovil.forEach(pm => {
      wsAnalisis.addRow([pm.fecha, pm.valor, pm.promedioMovil?.toFixed(2) || '—']);
    });
    wsAnalisis.addRow([]);
    
    wsAnalisis.addRow(['UMBRALES DE ALERTA']);
    const umbrales = this.calcularUmbrales(valores);
    wsAnalisis.addRow(['Valor Crítico Mínimo:', umbrales.minimoCritico?.toFixed(2) || '—']);
    wsAnalisis.addRow(['Valor Crítico Máximo:', umbrales.maximoCritico?.toFixed(2) || '—']);
    wsAnalisis.addRow(['Alertas Activas:', umbrales.alertasActivas || 'Ninguna']);
    
    wsAnalisis.getRow(1).font = { bold: true, size: 14 };
    wsAnalisis.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    wsAnalisis.columns = [
      { header: 'Concepto', key: 'concepto', width: 25 },
      { header: 'Valor', key: 'valor', width: 20 },
      { header: 'Adicional', key: 'adicional', width: 20 }
    ];

    const bombaLecturas = lecturas.filter(l => l.unidad_medida === 'bomba_estado');
    if (bombaLecturas.length > 0) {
      const wsEventos = workbook.addWorksheet('Eventos');
      const activaciones = this.contarActivacionesBomba(lecturas as any[]);
      wsEventos.addRow(['Activaciones de bomba (0→1)', activaciones]);
      
      wsEventos.addRow([]);
      wsEventos.addRow(['DETALLE DE EVENTOS DE BOMBA']);
      wsEventos.addRow(['Fecha', 'Hora', 'Evento', 'Duración (min)']);
      
      const eventosBomba = this.obtenerEventosBomba(lecturas as any[]);
      eventosBomba.forEach(evento => {
        wsEventos.addRow([
          evento.fecha,
          evento.hora,
          evento.evento,
          evento.duracion || '—'
        ]);
      });
    }

    return workbook.xlsx.writeBuffer();
  }

  async buildPDFPorTopic(topic: string, metric?: string, desde?: Date, hasta?: Date) {
    const metricNorm = normalizeMetric(metric);
    const lecturas = await this.obtenerLecturasPorTopic(topic, { metric: metricNorm, desde, hasta });

    const pdf = new (PDFDocument as any)();
    const buffers: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      try {
        pdf.on('data', (d: Buffer) => buffers.push(d));
        pdf.on('end', () => resolve(Buffer.concat(buffers)));

        pdf.fontSize(20).text('Reporte por Topic', { align: 'center' });
        pdf.moveDown();
        pdf.fontSize(12).text(`Topic: ${topic}`);
        pdf.fontSize(12).text(`Métrica: ${metricNorm ?? 'todas'}`);
        pdf.moveDown();

        const resumen = this.calcularResumen(lecturas as any[]);
        pdf.fontSize(14).text('Resumen de valores:');
        pdf.fontSize(12).text(`Cantidad: ${resumen.count}`);
        pdf.fontSize(12).text(`Promedio: ${resumen.avg ?? '—'}`);
        pdf.fontSize(12).text(`Mínimo: ${resumen.min ?? '—'}`);
        pdf.fontSize(12).text(`Máximo: ${resumen.max ?? '—'}`);
        pdf.moveDown();

        pdf.fontSize(14).text('Lecturas:');
        for (const l of lecturas.slice(0, 100)) {
          let valor = Number(l.valor);
          if (l.unidad_medida === 'humedad_suelo_adc') {
            valor = convertirHumedadSuelo(valor);
          }
          pdf.fontSize(10).text(`${l.fecha.toISOString()} | ${l.unidad_medida ?? ''} | ${valor} ${l.observaciones ? '| ' + l.observaciones : ''}`);
        }
        pdf.addPage();

        const serie = metricNorm ? lecturas.filter((l) => l.unidad_medida === metricNorm) : lecturas;
        const pts = serie.map((l) => ({ x: l.fecha.getTime(), y: Number(l.valor) })).filter((p) => Number.isFinite(p.y));
        if (pts.length >= 2) {
          const margin = 40;
          const w = 550, h = 350;
          const x0 = margin, y0 = margin, x1 = x0 + w, y1 = y0 + h;
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          const scaleX = (val: number) => x0 + ((val - minX) / (maxX - minX || 1)) * w;
          const scaleY = (val: number) => y1 - ((val - minY) / (maxY - minY || 1)) * h;

          pdf.fontSize(14).text('Gráfica de valores', x0, y0 - 25);
          pdf.rect(x0, y0, w, h).stroke();

          pdf.moveTo(scaleX(pts[0].x), scaleY(pts[0].y));
          for (let i = 1; i < pts.length; i++) {
            pdf.lineTo(scaleX(pts[i].x), scaleY(pts[i].y));
          }
          pdf.stroke();
        } else {
          pdf.fontSize(12).text('No hay suficientes datos para graficar.');
        }

        pdf.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  async obtenerSensoresConUbicaciones() {
    try {
      const sensores = await this.sensorRepo.createQueryBuilder('sensor')
        .leftJoinAndSelect('sensor.id_sublote', 'sublote')
        .leftJoinAndSelect('sublote.id_lote', 'lote')
        .leftJoinAndSelect('sensor.cultivo', 'cultivo')
        .getMany();

      console.log('🔍 Sensores encontrados en BD:', sensores.length);

      if (!sensores || sensores.length === 0) {
        this.logger.warn('⚠️ No se encontraron sensores reales.');
        return [];
      }

      return sensores.map(sensor => ({
        id_sensor: sensor.id_sensor,
        tipo_sensor: sensor.tipo_sensor,
        estado: sensor.estado,
        mqtt_topic: sensor.mqtt_topic,
        ultima_lectura: sensor.ultima_lectura,
        valor_actual: sensor.valor_actual,
        cultivo: sensor.cultivo ? {
          id_cultivo: sensor.cultivo.id_cultivo,
          nombre_cultivo: sensor.cultivo.nombre_cultivo,
          tipo_cultivo: sensor.cultivo.tipo_cultivo
        } : null,
        sublote: sensor.id_sublote ? {
          id_sublote: sensor.id_sublote.id_sublote,
          descripcion: sensor.id_sublote.descripcion,
          ubicacion: sensor.id_sublote.ubicacion,
          coordenadas: sensor.id_sublote.coordenadas
        } : null 
      }));
    } catch (error) {
      this.logger.error('❌ Error obteniendo sensores:', error);
      return [];
    }
  }

  private generateDemoSensoresData() {
    return [
      {
        id_sensor: 1,
        tipo_sensor: 'temperatura',
        estado: 'activo',
        mqtt_topic: 'luixxa/dht11',
        ultima_lectura: new Date(),
        valor_actual: 24.5,
        cultivo: {
          id_cultivo: 1,
          nombre_cultivo: 'Tomate',
          tipo_cultivo: 'Hortalizas'
        },
        sublote: {
          id_sublote: 1,
          descripcion: 'Sublote A1',
          ubicacion: 'Zona Norte',
          coordenadas: '5.0705,-75.5138'
        }
      },
      {
        id_sensor: 2,
        tipo_sensor: 'humedad aire',
        estado: 'activo',
        mqtt_topic: 'luixxa/dht11',
        ultima_lectura: new Date(),
        valor_actual: 65.2,
        cultivo: {
          id_cultivo: 1,
          nombre_cultivo: 'Tomate',
          tipo_cultivo: 'Hortalizas'
        },
        sublote: {
          id_sublote: 1,
          descripcion: 'Sublote A1',
          ubicacion: 'Zona Norte',
          coordenadas: '5.0705,-75.5138'
        }
      },
      {
        id_sensor: 3,
        tipo_sensor: 'humedad suelo',
        estado: 'activo',
        mqtt_topic: 'luixxa/dht11',
        ultima_lectura: new Date(),
        valor_actual: 58.7,
        cultivo: {
          id_cultivo: 2,
          nombre_cultivo: 'Lechuga',
          tipo_cultivo: 'Hortalizas'
        },
        sublote: {
          id_sublote: 2,
          descripcion: 'Sublote B1',
          ubicacion: 'Zona Sur',
          coordenadas: '5.0695,-75.5140'
        }
      }
    ];
  }

  async obtenerLecturasIoTCompletas(desde?: Date, hasta?: Date) {
    try {
      const qb = this.lecturaRepo.createQueryBuilder('l')
        .leftJoin('l.sensor', 'sensor')
        .leftJoin('sensor.id_sublote', 'sublotes')
        .leftJoin('sublotes.id_lote', 'lotes')
        .leftJoin('sensor.cultivo_id', 'cultivos')
        .select([
          'l.id_lectura',
          'l.fecha',
          'l.valor',
          'l.unidad_medida',
          'l.observaciones',
          'l.mqtt_topic',
          'sensor.id_sensor',
          'sensor.tipo_sensor',
          'sensor.estado',
          'cultivos.id_cultivo',
          'cultivos.nombre_cultivo',
          'cultivos.tipo_cultivo',
          'sublotes.id_sublote',
          'sublotes.descripcion',
          'sublotes.ubicacion',
          'sublotes.coordenadas'
        ]);

      if (desde) qb.andWhere('l.fecha >= :desde', { desde });
      if (hasta) qb.andWhere('l.fecha <= :hasta', { hasta });
      
      qb.orderBy('l.fecha', 'DESC');

      const lecturas = await qb.getMany();
      this.logger.log('🔍 Lecturas encontradas en BD:', lecturas.length);
      
      if (!lecturas || lecturas.length === 0) {
        this.logger.warn('⚠️ No se encontraron lecturas históricas reales.');
        return [];
      }
      
      return lecturas.map(lectura => ({
        ...lectura,
        sensor_info: lectura.sensor ? {
          id_sensor: lectura.sensor.id_sensor,
          tipo_sensor: lectura.sensor.tipo_sensor,
          estado: lectura.sensor.estado
        } : null,
        cultivo_info: lectura.sensor?.cultivo ? {
          id_cultivo: lectura.sensor.cultivo.id_cultivo,
          nombre_cultivo: lectura.sensor.cultivo.nombre_cultivo,
          tipo_cultivo: lectura.sensor.cultivo.tipo_cultivo
        } : null,
        ubicacion_info: lectura.sensor?.id_sublote ? {
          id_sublote: lectura.sensor.id_sublote.id_sublote,
          descripcion: lectura.sensor.id_sublote.descripcion,
          ubicacion: lectura.sensor.id_sublote.ubicacion,
          coordenadas: lectura.sensor.id_sublote.coordenadas
        } : null
      }));
    } catch (error) {
      this.logger.error('❌ Error obteniendo lecturas IoT:', error);
      return [];
    }
  }

  private generateDemoLecturasData(desde?: Date, hasta?: Date) {
    console.log('Generando datos demo de lecturas...');
    const lecturas: any[] = []; 
    const fechaInicio = desde || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
    const fechaFin = hasta || new Date();
    
    console.log('Rango de datos demo:', { fechaInicio: fechaInicio.toISOString(), fechaFin: fechaFin.toISOString() });
    
    const ahora = fechaFin.getTime();
    const inicio = fechaInicio.getTime();
    const duracion = ahora - inicio;
    const intervalo = 30 * 60 * 1000; 
    
    console.log(`Generando ${Math.floor(duracion / intervalo)} puntos de datos...`);
    
    for (let tiempo = inicio; tiempo <= ahora; tiempo += intervalo) {
      const fecha = new Date(tiempo);
      
      const hora = fecha.getHours();
      const factorTemperatura = Math.sin((hora - 6) * Math.PI / 12) * 7; 
      const temperatura = 25 + factorTemperatura + (Math.random() - 0.5) * 4;
      lecturas.push({
        id_lectura: lecturas.length + 1,
        fecha,
        valor: Math.round(temperatura * 10) / 10,
        unidad_medida: 'temperatura',
        observaciones: 'Lectura automática',
        mqtt_topic: 'luixxa/dht11',
        sensor_info: {
          id_sensor: 1,
          tipo_sensor: 'temperatura',
          estado: 'activo'
        },
        cultivo_info: {
          id_cultivo: 1,
          nombre_cultivo: 'Tomate',
          tipo_cultivo: 'Hortalizas'
        },
        ubicacion_info: {
          id_sublote: 1,
          descripcion: 'Sublote A1',
          ubicacion: 'Zona Norte',
          coordenadas: '5.0705,-75.5138'
        }
      });
      
      const humedadAire = 70 - factorTemperatura * 2 + (Math.random() - 0.5) * 10;
      lecturas.push({
        id_lectura: lecturas.length + 1,
        fecha,
        valor: Math.round(Math.max(40, Math.min(85, humedadAire)) * 10) / 10,
        unidad_medida: 'humedad_aire',
        observaciones: 'Lectura automática',
        mqtt_topic: 'luixxa/dht11',
        sensor_info: {
          id_sensor: 2,
          tipo_sensor: 'humedad aire',
          estado: 'activo'
        },
        cultivo_info: {
          id_cultivo: 1,
          nombre_cultivo: 'Tomate',
          tipo_cultivo: 'Hortalizas'
        },
        ubicacion_info: {
          id_sublote: 1,
          descripcion: 'Sublote A1',
          ubicacion: 'Zona Norte',
          coordenadas: '5.0705,-75.5138'
        }
      });
      
      let humedadSuelo = 50 + Math.sin(tiempo / (24 * 60 * 60 * 1000)) * 20; 
      const diasDesdeInicio = Math.floor((tiempo - inicio) / (24 * 60 * 60 * 1000));
      if (diasDesdeInicio % 2 === 0 && hora >= 6 && hora <= 8) {
        humedadSuelo = Math.min(80, humedadSuelo + 15); 
      }
      humedadSuelo += (Math.random() - 0.5) * 10;
      
      lecturas.push({
        id_lectura: lecturas.length + 1,
        fecha,
        valor: Math.round(Math.max(30, Math.min(80, humedadSuelo)) * 10) / 10,
        unidad_medida: 'humedad_suelo_porcentaje',
        observaciones: 'Lectura automática',
        mqtt_topic: 'luixxa/dht11',
        sensor_info: {
          id_sensor: 3,
          tipo_sensor: 'humedad suelo',
          estado: 'activo'
        },
        cultivo_info: {
          id_cultivo: 2,
          nombre_cultivo: 'Lechuga',
          tipo_cultivo: 'Hortalizas'
        },
        ubicacion_info: {
          id_sublote: 2,
          descripcion: 'Sublote B1',
          ubicacion: 'Zona Sur',
          coordenadas: '5.0695,-75.5140'
        }
      });
      
      const debeRegar = humedadSuelo < 45;
      const bombaActiva = debeRegar && (hora >= 6 && hora <= 18) && Math.random() > 0.7;
      if (bombaActiva || (diasDesdeInicio % 3 === 0 && hora === 7)) {
        lecturas.push({
          id_lectura: lecturas.length + 1,
          fecha,
          valor: bombaActiva ? 1 : 0,
          unidad_medida: 'bomba_estado',
          observaciones: bombaActiva ? 'Riego automático' : 'Bomba apagada',
          mqtt_topic: 'luixxa/dht11',
          sensor_info: {
            id_sensor: 4,
            tipo_sensor: 'bomba agua',
            estado: 'activo'
          },
          cultivo_info: {
            id_cultivo: 1,
            nombre_cultivo: 'Tomate',
            tipo_cultivo: 'Hortalizas'
          },
          ubicacion_info: {
            id_sublote: 1,
            descripcion: 'Sublote A1',
            ubicacion: 'Zona Norte',
            coordenadas: '5.0705,-75.5138'
          }
        });
      }
    }
    
    console.log(`✅ Generadas ${lecturas.length} lecturas demo`);
    return lecturas;
  }

  async contarActivacionesBombaPorPeriodo(desde?: Date, hasta?: Date) {
    try {
      const qb = this.lecturaRepo.createQueryBuilder('l')
        .where('l.unidad_medida = :unidad', { unidad: 'bomba_estado' });

      if (desde) qb.andWhere('l.fecha >= :desde', { desde });
      if (hasta) qb.andWhere('l.fecha <= :hasta', { hasta });

      qb.orderBy('l.fecha', 'ASC');

      const lecturasBomba = await qb.getMany();
      
      if (!lecturasBomba || lecturasBomba.length === 0) {
        console.warn('⚠️ No se encontraron lecturas de bomba en la base de datos - generando demo');
        return this.generateDemoBombaData(desde, hasta);
      }
      
      let activacionesDiarias = 0;
      let activacionesSemanales = 0;
      
      for (let i = 1; i < lecturasBomba.length; i++) {
        const prev = Number(lecturasBomba[i - 1].valor);
        const curr = Number(lecturasBomba[i].valor);
        if (prev === 0 && curr === 1) {
          activacionesSemanales++;
          
          const diffDays = (lecturasBomba[i].fecha.getTime() - lecturasBomba[i-1].fecha.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 1) {
            activacionesDiarias++;
          }
        }
      }

      return {
        activaciones_diarias: activacionesDiarias,
        activaciones_semanales: activacionesSemanales,
        total_lecturas_bomba: lecturasBomba.length
      };
    } catch (error) {
      console.error('Error contando activaciones de bomba:', error);
      return this.generateDemoBombaData(desde, hasta);
    }
  }

  private generateDemoBombaData(desde?: Date, hasta?: Date) {
    const fechaInicio = desde || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
    const fechaFin = hasta || new Date();
    
    
    let activacionesDiarias = 0;
    let activacionesSemanales = 0;
    let totalLecturas = 0;
    
    const dias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let dia = 0; dia < dias; dia++) {
      const fechaDia = new Date(fechaInicio.getTime() + dia * 24 * 60 * 60 * 1000);
      
      if (dia % 2 === 0 || dia % 3 === 0) {
        const horaMañana = 6 + Math.random() * 2; 
        activacionesSemanales++;
        
        if (Math.random() > 0.6) {
          const horaTarde = 17 + Math.random() * 2; 
          activacionesSemanales++;
        }
        
        totalLecturas += 2; // Lecturas de encendido/apagado
        
        // Contar como activación diaria si es hoy
        if (fechaDia.toDateString() === new Date().toDateString()) {
          activacionesDiarias = Math.random() > 0.5 ? 1 : 2;
        }
      }
      
      totalLecturas += 48; // Lecturas cada 30 minutos del día completo
    }
    
    return {
      activaciones_diarias: activacionesDiarias || (Math.random() > 0.5 ? 1 : 0),
      activaciones_semanales: activacionesSemanales || Math.floor(Math.random() * 5) + 2,
      total_lecturas_bomba: totalLecturas || Math.floor(Math.random() * 100) + 50
    };
  }

  async buildIoTCompletePDF(desde?: Date, hasta?: Date) {
    console.log('Iniciando generación de PDF IoT con UTF-8...');
    console.log('Rango de fechas:', { desde, hasta });
    
    let sensores = await this.obtenerSensoresConUbicaciones();
    let lecturas = await this.obtenerLecturasIoTCompletas(desde, hasta);
    
    console.log('✅ Datos obtenidos:', { sensores: sensores.length, lecturas: lecturas.length });
    
    if (lecturas.length === 0) {
      this.logger.warn('⚠️ No hay lecturas históricas para el período seleccionado.');
    }
    if (sensores.length === 0) {
      this.logger.warn('⚠️ No se encontraron sensores para incluir en el reporte.');
    }
    
    console.log('Métricas encontradas:', [...new Set(lecturas.map(l => l.unidad_medida))]);
    
    const bombaData = await this.contarActivacionesBombaPorPeriodo(desde, hasta);
    console.log('Datos de bomba:', bombaData);

    const pdf = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });
    
    pdf.font('Helvetica');
    const buffers: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      try {
        pdf.on('data', (d: Buffer) => buffers.push(d));
        pdf.on('end', () => {
          console.log('PDF generado exitosamente. Tamaño:', Buffer.concat(buffers).length, 'bytes');
          resolve(Buffer.concat(buffers));
        });

        this.addPortadaYDatosImportantesToPDF(pdf, sensores, lecturas, desde, hasta, bombaData);

        this.addGraficasPequenasSensoresToPDF(pdf, lecturas);

        console.log('PDF generado con 2 páginas máximo, datos importantes y gráficas pequeñas');
        pdf.end();
      } catch (e) {
        console.error('Error generando PDF:', e);
        reject(e);
      }
    });
  }


  private addPortadaYDatosImportantesToPDF(pdf: any, sensores: any[], lecturas: any[], desde?: Date, hasta?: Date, bombaData?: any) {
    pdf.fontSize(28).text('AGROTIC – REPORTE DE SENSORES IoT', { align: 'center' });
    pdf.moveDown(1);
    
    // Fecha y hora de generación
    const fechaGeneracion = new Date().toLocaleString('es-CO', { 
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    pdf.fontSize(12).text(`Generado el: ${fechaGeneracion}`, { align: 'center' });
    pdf.moveDown(2);
    
    pdf.fontSize(18).text('DATOS MÁS IMPORTANTES', { underline: true });
    pdf.moveDown(1);
    
    // Temperatura
    const lecturasTemperatura = lecturas.filter(l => l.unidad_medida === 'temperatura');
    const resumenTemp = this.calcularResumen(lecturasTemperatura);
    pdf.fontSize(14).text(`TEMPERATURA: Promedio ${resumenTemp.avg?.toFixed(1) || 'N/A'}°C (Min: ${resumenTemp.min || 'N/A'}°C, Max: ${resumenTemp.max || 'N/A'}°C)`);
    
    // Humedad ambiente
    const lecturasHumedadAire = lecturas.filter(l => l.unidad_medida === 'humedad_aire');
    const resumenHumAire = this.calcularResumen(lecturasHumedadAire);
    pdf.fontSize(14).text(`HUMEDAD AMBIENTE: Promedio ${resumenHumAire.avg?.toFixed(1) || 'N/A'}%`);
    
    // Humedad del suelo
    const lecturasHumedadSuelo = lecturas.filter(l => l.unidad_medida === 'humedad_suelo_porcentaje');
    const resumenHumSuelo = this.calcularResumen(lecturasHumedadSuelo);
    pdf.fontSize(14).text(`HUMEDAD SUELO: Promedio ${resumenHumSuelo.avg?.toFixed(1) || 'N/A'}%`);
    
    // Bomba
    pdf.fontSize(14).text(`BOMBA DE RIEGO: ${bombaData?.activaciones_semanales || 0} activaciones`);
    
    // Total registros
    pdf.fontSize(14).text(`📊 TOTAL REGISTROS: ${lecturas.length} lecturas históricas`);
    
    // Sensores incluidos
    const sensoresUnicos = [...new Set(sensores.map(s => s.tipo_sensor))];
    if (sensoresUnicos.length > 0) {
      pdf.fontSize(12).text(`SENSORES: ${sensoresUnicos.join(', ')}`);
    }
    
    // Rango de fechas
    const rangoFechas = `RANGO: ${desde ? desde.toLocaleDateString('es-CO') : 'Inicio'} - ${hasta ? hasta.toLocaleDateString('es-CO') : 'Actual'}`;
    pdf.fontSize(12).text(rangoFechas);
    
    pdf.addPage();
  }

  private addGraficasPequenasSensoresToPDF(pdf: any, lecturas: any[]) {
    pdf.fontSize(18).text('GRÁFICAS POR SENSOR', { underline: true });
    pdf.moveDown(1);
    
    const metricas = ['temperatura', 'humedad_aire', 'humedad_suelo_porcentaje', 'bomba_estado'];
    const titulos = {
      'temperatura': '🌡️ TEMPERATURA',
      'humedad_aire': '💧 HUMEDAD AMBIENTE', 
      'humedad_suelo_porcentaje': '🌱 HUMEDAD SUELO',
      'bomba_estado': '💦 ESTADO BOMBA'
    };
    
    const cols = 2;
    const rows = 2;
    const graphWidth = 250;
    const graphHeight = 150;
    const startX = 50;
    const startY = pdf.y + 20;
    const spacingX = 20;
    const spacingY = 20;
    
    metricas.forEach((metrica, index) => {
      const lecturasMetrica = lecturas.filter(l => l.unidad_medida === metrica);
      
      if (lecturasMetrica.length > 1) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = startX + col * (graphWidth + spacingX);
        const y = startY + row * (graphHeight + spacingY + 30); 
        
        pdf.fontSize(12).text(titulos[metrica], x, y - 15);
        
        this.drawSmallTimeSeriesGraph(pdf, lecturasMetrica, x, y, graphWidth, graphHeight);
      }
    });
  }

  private drawSmallTimeSeriesGraph(pdf: any, lecturas: any[], x: number, y: number, width: number, height: number) {
    if (lecturas.length < 2) return;

    const margin = 20;
    const plotX = x + margin;
    const plotY = y + margin;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;

    const puntos = lecturas.map(l => {
      let valor = Number(l.valor);
      if (l.unidad_medida === 'humedad_suelo_adc') {
        valor = convertirHumedadSuelo(valor);
      }
      return { 
        fecha: new Date(l.fecha).getTime(), 
        valor: valor 
      };
    }).filter(p => !isNaN(p.valor));

    if (puntos.length < 2) return;

    const fechas = puntos.map(p => p.fecha);
    const valores = puntos.map(p => p.valor);
    const minFecha = Math.min(...fechas);
    const maxFecha = Math.max(...fechas);
    const minValor = Math.min(...valores);
    const maxValor = Math.max(...valores);

    pdf.rect(plotX, plotY, plotWidth, plotHeight).stroke();

    const scaleX = (fecha: number) => plotX + ((fecha - minFecha) / (maxFecha - minFecha || 1)) * plotWidth;
    const scaleY = (valor: number) => plotY + plotHeight - ((valor - minValor) / (maxValor - minValor || 1)) * plotHeight;

    pdf.strokeColor('#2563eb').lineWidth(1.5);
    pdf.moveTo(scaleX(puntos[0].fecha), scaleY(puntos[0].valor));
    
    for (let i = 1; i < puntos.length; i++) {
      pdf.lineTo(scaleX(puntos[i].fecha), scaleY(puntos[i].valor));
    }
    pdf.stroke();

    pdf.fontSize(8).fillColor('#6b7280');
    pdf.text(`${minValor.toFixed(1)}`, plotX - 15, plotY + plotHeight - 6);
    pdf.text(`${maxValor.toFixed(1)}`, plotX - 15, plotY - 6);

    pdf.fillColor('#000000');
  }
  private drawTimeSeriesGraph(pdf: any, lecturas: any[], x: number, y: number, width: number, height: number, title: string) {
    if (lecturas.length < 2) return;

    pdf.fontSize(14).text(title, x, y - 20);
    
    // Configurar coordenadas
    const margin = 40;
    const plotX = x + margin;
    const plotY = y + margin;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;

    const puntos = lecturas.map(l => {
      let valor = Number(l.valor);
      if (l.unidad_medida === 'humedad_suelo_adc') {
        valor = convertirHumedadSuelo(valor);
      }
      return { 
        fecha: new Date(l.fecha).getTime(), 
        valor: valor 
      };
    }).filter(p => !isNaN(p.valor));

    if (puntos.length < 2) return;

    const fechas = puntos.map(p => p.fecha);
    const valores = puntos.map(p => p.valor);
    const minFecha = Math.min(...fechas);
    const maxFecha = Math.max(...fechas);
    const minValor = Math.min(...valores);
    const maxValor = Math.max(...valores);

    pdf.rect(plotX, plotY, plotWidth, plotHeight).stroke();

    const scaleX = (fecha: number) => plotX + ((fecha - minFecha) / (maxFecha - minFecha || 1)) * plotWidth;
    const scaleY = (valor: number) => plotY + plotHeight - ((valor - minValor) / (maxValor - minValor || 1)) * plotHeight;

    pdf.strokeColor('#2563eb').lineWidth(2);
    pdf.moveTo(scaleX(puntos[0].fecha), scaleY(puntos[0].valor));
    
    for (let i = 1; i < puntos.length; i++) {
      pdf.lineTo(scaleX(puntos[i].fecha), scaleY(puntos[i].valor));
    }
    pdf.stroke();

    pdf.fontSize(9).fillColor('#6b7280');
    pdf.text(`${minValor.toFixed(1)}`, plotX - 20, plotY + plotHeight - 8);
    pdf.text(`${maxValor.toFixed(1)}`, plotX - 20, plotY - 8);
    
    const fechaInicio = new Date(minFecha).toLocaleDateString('es-CO');
    const fechaFin = new Date(maxFecha).toLocaleDateString('es-CO');
    pdf.text(fechaInicio, plotX, plotY + plotHeight + 10);
    pdf.text(fechaFin, plotX + plotWidth - 40, plotY + plotHeight + 10);

    pdf.fillColor('#000000');
  }

  async buildIoTCompleteExcel(desde?: Date, hasta?: Date) {
    console.log('Iniciando generación de Excel IoT...');
    console.log('Rango de fechas:', { desde, hasta });
    
    let lecturas = await this.obtenerLecturasIoTCompletas(desde, hasta);
    
    console.log('✅ Datos obtenidos para Excel:', lecturas.length, 'lecturas');
    
    // Si no hay datos, el reporte será generado con hojas vacías o indicando "N/A"
    if (lecturas.length === 0) {
      this.logger.warn('⚠️ No hay lecturas reales para el período seleccionado. El Excel se generará sin datos.');
    }
    
    console.log('🔍 Métricas encontradas:', [...new Set(lecturas.map(l => l.unidad_medida))]);
    
    const bombaData = await this.contarActivacionesBombaPorPeriodo(desde, hasta);

    const workbook = new Workbook();

    const wsResumen = workbook.addWorksheet('Resumen General');
    
    const lecturasTemperatura = lecturas.filter(l => l.unidad_medida === 'temperatura');
    const resumenTemp = this.calcularResumen(lecturasTemperatura);
    
    const lecturasHumAire = lecturas.filter(l => l.unidad_medida === 'humedad_aire');
    const resumenHumAire = this.calcularResumen(lecturasHumAire);
    
    const lecturasHumSuelo = lecturas.filter(l => l.unidad_medida === 'humedad_suelo_porcentaje');
    const resumenHumSuelo = this.calcularResumen(lecturasHumSuelo);
    
    wsResumen.addRow(['MÉTRICA', 'PROMEDIO', 'MÍNIMO', 'MÁXIMO']);
    wsResumen.addRow(['Temperatura (°C)', resumenTemp.avg?.toFixed(2) || 'N/A', resumenTemp.min || 'N/A', resumenTemp.max || 'N/A']);
    wsResumen.addRow(['Humedad Ambiente (%)', resumenHumAire.avg?.toFixed(2) || 'N/A', resumenHumAire.min || 'N/A', resumenHumAire.max || 'N/A']);
    wsResumen.addRow(['Humedad del Suelo (%)', resumenHumSuelo.avg?.toFixed(2) || 'N/A', resumenHumSuelo.min || 'N/A', resumenHumSuelo.max || 'N/A']);
    
    wsResumen.addRow([]);
    wsResumen.addRow(['TOTALES', 'VALOR']);
    wsResumen.addRow(['Total de registros', lecturas.length]);
    wsResumen.addRow(['Activaciones de bomba', bombaData.activaciones_semanales]);

    const wsTemperatura = workbook.addWorksheet('Temperatura');
    wsTemperatura.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Hora', key: 'hora', width: 12 },
      { header: 'Valor', key: 'valor', width: 10 }
    ];
    
    lecturasTemperatura
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .forEach(lectura => {
        wsTemperatura.addRow({
          fecha: new Date(lectura.fecha).toISOString().split('T')[0],
          hora: new Date(lectura.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          valor: Number(lectura.valor).toFixed(2)
        });
      });

    const wsHumedadAire = workbook.addWorksheet('Humedad Ambiente');
    wsHumedadAire.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Hora', key: 'hora', width: 12 },
      { header: 'Valor', key: 'valor', width: 10 }
    ];
    
    lecturasHumAire
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .forEach(lectura => {
        wsHumedadAire.addRow({
          fecha: new Date(lectura.fecha).toISOString().split('T')[0],
          hora: new Date(lectura.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          valor: Number(lectura.valor).toFixed(2)
        });
      });

    const wsHumedadSuelo = workbook.addWorksheet('Humedad del Suelo');
    wsHumedadSuelo.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Hora', key: 'hora', width: 12 },
      { header: 'Valor', key: 'valor', width: 10 }
    ];
    
    lecturasHumSuelo
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .forEach(lectura => {
        let valor = Number(lectura.valor);
        if (lectura.unidad_medida === 'humedad_suelo_adc') {
          valor = convertirHumedadSuelo(valor);
        }
        wsHumedadSuelo.addRow({
          fecha: new Date(lectura.fecha).toISOString().split('T')[0],
          hora: new Date(lectura.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          valor: valor.toFixed(2)
        });
      });

    const wsBomba = workbook.addWorksheet('Estado de la Bomba');
    wsBomba.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Hora', key: 'hora', width: 12 },
      { header: 'Estado', key: 'estado', width: 10 }
    ];
    
    const lecturasBomba = lecturas.filter(l => l.unidad_medida === 'bomba_estado')
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    
    lecturasBomba.forEach(lectura => {
      const estado = Number(lectura.valor) === 1 ? 'ON' : 'OFF';
      wsBomba.addRow({
        fecha: new Date(lectura.fecha).toISOString().split('T')[0],
        hora: new Date(lectura.fecha).toTimeString().split(' ')[0],
        estado: estado
      });
    });

    console.log('✅ Excel generado con estructura correcta:');
    console.log('  - Hoja 1: Resumen General');
    console.log('  - Hoja 2: Temperatura (', lecturasTemperatura.length, 'registros)');
    console.log('  - Hoja 3: Humedad Ambiente (', lecturasHumAire.length, 'registros)');
    console.log('  - Hoja 4: Humedad del Suelo (', lecturasHumSuelo.length, 'registros)');
    console.log('  - Hoja 5: Estado de la Bomba (', lecturasBomba.length, 'registros)');
    
    return workbook.xlsx.writeBuffer();
  }

  async buildExcelGeneralPorTopic(topic: string, desde?: Date, hasta?: Date) {
    // Obtener todas las lecturas sin filtrar por métrica
    const lecturas = await this.obtenerLecturasPorTopic(topic, { desde, hasta });

    const workbook = new Workbook();
    
    const wsResumen = workbook.addWorksheet('Resumen General');
    wsResumen.addRow(['Reporte General de Sensores']);
    wsResumen.addRow(['Topic', topic]);
    wsResumen.addRow(['Período', `${desde?.toISOString() || 'Inicio'} - ${hasta?.toISOString() || 'Ahora'}`]);
    wsResumen.addRow([]);

    const lecturasPorMetrica = this.agruparLecturasPorMetrica(lecturas);
    
    wsResumen.addRow(['Resumen por Métrica']);
    wsResumen.addRow(['Métrica', 'Cantidad', 'Promedio', 'Mínimo', 'Máximo']);
    
    Object.entries(lecturasPorMetrica).forEach(([metrica, datos]) => {
      const resumen = this.calcularResumen(datos);
      wsResumen.addRow([
        metrica,
        resumen.count,
        resumen.avg?.toFixed(2) || 'N/A',
        resumen.min?.toFixed(2) || 'N/A',
        resumen.max?.toFixed(2) || 'N/A'
      ]);
    });

    Object.entries(lecturasPorMetrica).forEach(([metrica, datos]) => {
      const ws = workbook.addWorksheet(this.getNombreHoja(metrica));
      ws.columns = [
        { header: 'Fecha', key: 'fecha', width: 24 },
        { header: 'Hora', key: 'hora', width: 12 },
        { header: 'Valor', key: 'valor', width: 12 },
        { header: 'Observaciones', key: 'observaciones', width: 30 }
      ];

      datos.forEach(lectura => {
        let valor = Number(lectura.valor);
        let valorMostrado: string | number = valor;
        
        if (lectura.unidad_medida === 'bomba_estado') {
          valorMostrado = valor === 1 ? 'ENCENDIDA' : 'APAGADA';
        } else if (lectura.unidad_medida?.includes('temperatura')) {
          valorMostrado = `${valor.toFixed(1)}°C`;
        } else if (lectura.unidad_medida?.includes('humedad')) {
          valorMostrado = `${valor.toFixed(1)}%`;
        }

        ws.addRow({
          fecha: new Date(lectura.fecha).toISOString().split('T')[0],
          hora: new Date(lectura.fecha).toTimeString().split(' ')[0],
          valor: valorMostrado,
          observaciones: lectura.observaciones || ''
        });
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  private calcularTendencia(valores: number[]): string {
    if (valores.length < 2) return 'insuficientes';
    
    const n = valores.length;
    const sumX = (n * (n - 1)) / 2; // Suma de 0,1,2,...,n-1
    const sumY = valores.reduce((a, b) => a + b, 0);
    const sumXY = valores.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Suma de x²
    
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (Math.abs(pendiente) < 0.01) return 'estable';
    return pendiente > 0 ? 'creciente' : 'decreciente';
  }

  private calcularDesviacionEstandar(valores: number[]): number | null {
    if (valores.length < 2) return null;
    
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const varianza = valores.reduce((sum, valor) => sum + Math.pow(valor - promedio, 2), 0) / valores.length;
    return Math.sqrt(varianza);
  }

  private calcularCoeficienteVariacion(valores: number[]): number | null {
    if (valores.length < 2) return null;
    
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    if (promedio === 0) return null;
    
    const desviacion = this.calcularDesviacionEstandar(valores);
    return desviacion ? (desviacion / Math.abs(promedio)) * 100 : null;
  }

  private calcularPromedioMovil(lecturas: any[], dias: number): Array<{fecha: string, valor: number, promedioMovil: number | null}> {
    const resultado: Array<{fecha: string, valor: number, promedioMovil: number | null}> = [];
    
    for (let i = 0; i < lecturas.length; i++) {
      const lecturaActual = lecturas[i];
      const valorActual = Number(lecturaActual.valor);
      
      let promedioMovil: number | null = null;
      
      if (i >= dias - 1) {
        const valoresVentana = lecturas.slice(i - dias + 1, i + 1).map(l => Number(l.valor));
        promedioMovil = valoresVentana.reduce((a, b) => a + b, 0) / dias;
      }
      
      resultado.push({
        fecha: new Date(lecturaActual.fecha).toISOString().split('T')[0],
        valor: valorActual,
        promedioMovil
      });
    }
    
    return resultado;
  }

  private calcularUmbrales(valores: number[]): {minimoCritico: number | null, maximoCritico: number | null, alertasActivas: string} {
    if (valores.length < 2) {
      return {minimoCritico: null, maximoCritico: null, alertasActivas: 'Ninguna'};
    }
    
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desviacion = this.calcularDesviacionEstandar(valores) || 0;
    
    const minimoCritico = promedio - (2 * desviacion);
    const maximoCritico = promedio + (2 * desviacion);
    
    const valoresFueraRango = valores.filter(v => v < minimoCritico || v > maximoCritico);
    const alertasActivas = valoresFueraRango.length > 0 
      ? `${valoresFueraRango.length} valores fuera de rango` 
      : 'Ninguna';
    
    return {minimoCritico, maximoCritico, alertasActivas};
  }

  private obtenerEventosBomba(lecturas: any[]): Array<{fecha: string, hora: string, evento: string, duracion: number | null}> {
    const eventos: Array<{fecha: string, hora: string, evento: string, duracion: number | null}> = [];
    
    // Filtrar solo lecturas de bomba y ordenar por fecha
    const bombaLecturas = lecturas
      .filter(l => l.unidad_medida === 'bomba_estado')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    let ultimoEncendido: Date | null = null;
    
    for (let i = 0; i < bombaLecturas.length; i++) {
      const lectura = bombaLecturas[i];
      const fecha = new Date(lectura.fecha);
      const valor = Number(lectura.valor);
      const fechaStr = fecha.toISOString().split('T')[0];
      const horaStr = fecha.toTimeString().split(' ')[0];
      
      if (valor === 1) {
        // Evento de encendido
        eventos.push({
          fecha: fechaStr,
          hora: horaStr,
          evento: 'ENCENDIDO',
          duracion: null
        });
        ultimoEncendido = fecha;
      } else if (valor === 0 && ultimoEncendido) {
        // Evento de apagado con duración
        const duracionMinutos = Math.round((fecha.getTime() - ultimoEncendido.getTime()) / 60000);
        
        const ultimoEvento = eventos.find(e => e.duracion === null);
        if (ultimoEvento) {
          ultimoEvento.duracion = duracionMinutos;
        }
        
        eventos.push({
          fecha: fechaStr,
          hora: horaStr,
          evento: 'APAGADO',
          duracion: duracionMinutos
        });
        
        ultimoEncendido = null;
      }
    }
    
    return eventos;
  }

  private agruparLecturasPorMetrica(lecturas: any[]): Record<string, any[]> {
    return lecturas.reduce((acc, lectura) => {
      const metrica = lectura.unidad_medida || 'desconocido';
      if (!acc[metrica]) {
        acc[metrica] = [];
      }
      acc[metrica].push(lectura);
      return acc;
    }, {});
  }

  private getNombreHoja(metrica: string): string {
    const nombres: Record<string, string> = {
      'temperatura': 'Temperatura',
      'humedad_aire': 'Humedad Aire',
      'humedad_suelo_porcentaje': 'Humedad Suelo',
      'bomba_estado': 'Estado Bomba'
    };
    return nombres[metrica] || metrica;
  }
}
