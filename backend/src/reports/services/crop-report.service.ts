import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository, Raw } from 'typeorm';
import { subDays } from 'date-fns';
import { format } from 'date-fns';

import { ReportFiltersDto } from '../dto/report-filters.dto';

import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Insumo } from '../../insumos/entities/insumo.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Utiliza } from '../../utiliza/entities/utiliza.entity';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Salida } from '../../salidas/entities/salida.entity';
import { Alerta } from '../../alertas/entities/alerta.entity';
import { Sensor } from '../../sensores/entities/sensor.entity';
import { Lectura } from '../../sensores/entities/lectura.entity';

import {
  ReporteCultivo,
  ActividadReporte,
  AlertaReporte,
  InventarioReporte,
  FinanzasReporte,
  MetricData,
  MetricSummary
} from '../interfaces/report.interface';

@Injectable()
export class CropReportService {
  private readonly logger = new Logger(CropReportService.name);
  private readonly defaultTimeZone = 'America/Argentina/Buenos_Aires';

  constructor(
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    
    @InjectRepository(Sublote)
    private readonly subloteRepository: Repository<Sublote>,
    
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    
    @InjectRepository(Utiliza)
    private readonly utilizaRepository: Repository<Utiliza>,
    
    @InjectRepository(Ingreso)
    private readonly ingresoRepository: Repository<Ingreso>,
    
    @InjectRepository(Salida)
    private readonly salidaRepository: Repository<Salida>,
    
    @InjectRepository(Alerta)
    private readonly alertaRepository: Repository<Alerta>,
    
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    
    @InjectRepository(Lectura)
    private readonly lecturaRepository: Repository<Lectura>,
  ) {}

  async generarReporteCultivo(filtros: ReportFiltersDto): Promise<ReporteCultivo> {
    try {
      const cultivo = await this.obtenerDatosCultivo(filtros.cultivoId);
      
      const reporte: Partial<ReporteCultivo> = {
        fechaGeneracion: new Date(),
        periodo: {
          inicio: new Date(filtros.fechaInicio),
          fin: new Date(filtros.fechaFin)
        },
        cultivo,
        sublotes: await this.obtenerSublotes(cultivo.id_cultivo),
        metricas: {}
      };

      // Obtener datos de sensores - FORZAR SIEMPRE PARA DEPURACIÓN
      console.log('[CropReportService] Forzando obtención de métricas para depuración');
      const metricaSolicitada = 'todas';
      console.log('[CropReportService] Métrica solicitada:', metricaSolicitada, 'Cultivo ID:', cultivo.id_cultivo);
      reporte.metricas = await this.obtenerDatosSensores(filtros, cultivo.id_cultivo, metricaSolicitada);
      console.log('[CropReportService] Métricas obtenidas:', Object.keys(reporte.metricas || {}));
      console.log('[CropReportService] Total de métricas:', Object.keys(reporte.metricas || {}).length);

      if (filtros.incluirActividades) {
        reporte.actividades = await this.obtenerActividades(filtros);
      }

      if (filtros.incluirFinanzas) {
        reporte.finanzas = await this.obtenerDatosFinancieros(filtros);
      }

      if (filtros.incluirInventario) {
        reporte.inventario = await this.obtenerDatosInventario(filtros);
      }

      if (filtros.incluirAlertas) {
        reporte.alertas = await this.obtenerAlertas(filtros, cultivo.id_cultivo);
      }

      if (filtros.incluirTrazabilidad) {
        reporte.trazabilidad = await this.obtenerDatosTrazabilidad(filtros);
      }

      // Generar análisis
      reporte.analisis = await this.generarAnalisis(reporte as ReporteCultivo);

      return reporte as ReporteCultivo;
    } catch (error) {
      this.logger.error(`Error al generar reporte: ${error.message}`, error.stack);
      throw new Error(`Error al generar el reporte: ${error.message}`);
    }
  }
  
  private async obtenerDatosCultivo(cultivoId: string | number): Promise<Cultivo> {
    const cultivo = await this.cultivoRepository.findOne({
      where: { id_cultivo: Number(cultivoId) },
      relations: ['lote']
    });

    if (!cultivo) {
      throw new Error(`No se encontró el cultivo con ID: ${cultivoId}`);
    }

    return cultivo;
  }

  private async obtenerSublotes(cultivoId: number): Promise<Sublote[]> {
    // Primero obtenemos el id_lote directamente del cultivo
    const cultivo = await this.cultivoRepository
      .createQueryBuilder('cultivo')
      .select('cultivo.id_lote', 'id_lote')
      .where('cultivo.id_cultivo = :id', { id: cultivoId })
      .getRawOne();

    if (!cultivo || !cultivo.id_lote) {
      return [];
    }

    // Luego buscamos los sublotes usando el id_lote
    return this.subloteRepository
      .createQueryBuilder('sublote')
      .leftJoinAndSelect('sublote.id_lote', 'lote')
      .where('sublote.id_lote = :loteId', { loteId: cultivo.id_lote })
      .getMany();
  }

  private async obtenerActividades(filtros: ReportFiltersDto) {
    try {
      const actividades = await this.actividadRepository.find({
        where: {
          id_cultivo: Number(filtros.cultivoId),
          fecha: Between(
            new Date(filtros.fechaInicio),
            new Date(filtros.fechaFin)
          )
        },
        relations: ['cultivo', 'utilizas', 'utilizas.id_insumo']
      });

      const actividadesMapeadas: ActividadReporte[] = actividades.map(act => ({
        id: act.id_actividad.toString(),
        tipo: act.tipo_actividad,
        fecha: act.fecha,
        descripcion: act.detalles || 'Sin descripción',
        responsable: act.responsable || 'Sin responsable',
        estado: act.estado,
        insumosUtilizados: act.utilizas?.map(u => ({
          insumo: u.id_insumo?.nombre_insumo || 'Insumo',
          cantidad: Number(u.cantidad) || 0,
          unidad: 'un',
          costo: Number(u.costo_unitario) || 0
        })) || [],
        costoTotal: act.utilizas?.reduce((total, u) => 
          total + (Number(u.cantidad) * Number(u.costo_unitario || 0)), 0) || 0
      }));

      return {
        lista: actividadesMapeadas,
        resumen: {
          totalActividades: actividadesMapeadas.length,
          porTipo: actividadesMapeadas.reduce((acc, act) => {
            acc[act.tipo] = (acc[act.tipo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          costoTotal: actividadesMapeadas.reduce((sum, act) => sum + act.costoTotal, 0)
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener actividades', error.stack);
      return {
        lista: [],
        resumen: {
          totalActividades: 0,
          porTipo: {},
          costoTotal: 0
        }
      };
    }
  }

  private async obtenerDatosSensores(
    filtros: ReportFiltersDto, 
    cultivoId: number,
    metricaEspecifica?: string
  ): Promise<Record<string, { datos: MetricData[]; resumen: MetricSummary }>> {
    try {
      console.log('[obtenerDatosSensores] INICIO - cultivoId:', cultivoId, 'métrica:', metricaEspecifica);
      console.log('[obtenerDatosSensores] Fechas:', filtros.fechaInicio, filtros.fechaFin);
      
      // CONSULTA DIRECTA A BASE DE DATOS - Omitir TypeORM temporalmente
      const sensoresQuery = await this.sensorRepository.query(`
        SELECT s.*, l.fecha, l.valor, l.unidad_medida 
        FROM sensores s 
        LEFT JOIN lecturas l ON s.id_sensor = l.sensor_id 
        WHERE l.fecha >= $1 AND l.fecha <= $2
        ORDER BY s.id_sensor, l.fecha DESC
        LIMIT 100
      `, [filtros.fechaInicio, filtros.fechaFin]);
      
      console.log('[obtenerDatosSensores] Datos crudos encontrados:', sensoresQuery.length);
      
      // Si no hay datos con JOIN, probar consulta simple
      if (!sensoresQuery.length) {
        console.log('[obtenerDatosSensores] Probando consulta simple de lecturas...');
        const lecturasSimple = await this.sensorRepository.query(`
          SELECT * FROM lecturas 
          WHERE fecha >= $1 AND fecha <= $2
          LIMIT 5
        `, [filtros.fechaInicio, filtros.fechaFin]);
        
        console.log('[obtenerDatosSensores] Lecturas simples:', lecturasSimple.length);
        if (lecturasSimple.length > 0) {
          console.log('[obtenerDatosSensores] Primera lectura:', lecturasSimple[0]);
        }
        
        const sensoresSimple = await this.sensorRepository.query('SELECT * FROM sensores LIMIT 5');
        console.log('[obtenerDatosSensores] Sensores simples:', sensoresSimple.length);
        if (sensoresSimple.length > 0) {
          console.log('[obtenerDatosSensores] Primer sensor:', sensoresSimple[0]);
        }
      }
      
      if (!sensoresQuery.length) {
        console.log('[obtenerDatosSensores] No hay datos - retornando vacío');
        return {};
      }

      // Agrupar por tipo de sensor
      const resultados: Record<string, { datos: MetricData[]; resumen: MetricSummary }> = {};
      
      sensoresQuery.forEach(row => {
        const tipoSensor = row.tipo_sensor || 'sensor';
        
        if (!resultados[tipoSensor]) {
          resultados[tipoSensor] = {
            datos: [],
            resumen: {
              promedio: 0,
              maximo: 0,
              minimo: 0,
              desviacionEstandar: 0,
              totalRegistros: 0,
              alertas: 0
            }
          };
        }
        
        resultados[tipoSensor].datos.push({
          fecha: new Date(row.fecha),
          valor: Number(row.valor) || 0,
          sensorId: row.id_sensor?.toString() || '0',
          sensorNombre: tipoSensor,
          unidad: row.unidad_medida || 'un',
          subgrupoId: '0',
          subgrupoNombre: 'General'
        });
      });
      
      // Calcular estadísticas
      Object.keys(resultados).forEach(tipoSensor => {
        const datos = resultados[tipoSensor].datos;
        if (datos.length > 0) {
          const valores = datos.map(d => d.valor);
          const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
          
          resultados[tipoSensor].resumen = {
            promedio,
            maximo: Math.max(...valores),
            minimo: Math.min(...valores),
            desviacionEstandar: this.calcularDesviacionEstandar(valores, promedio),
            totalRegistros: valores.length,
            alertas: 0
          };
        }
      });
      
      console.log('[obtenerDatosSensores] RESULTADOS finales:', Object.keys(resultados));
      return resultados;
    } catch (error) {
      console.error('[CropReportService] Error al obtener métricas de sensores', error);
      return {};
    }
  }

  private async obtenerDatosFinancieros(filtros: ReportFiltersDto) {
    try {
      // Obtener ingresos del cultivo
      const ingresos = await this.ingresoRepository.find({
        where: {
          id_cultivo: Number(filtros.cultivoId),
          fecha_ingreso: Between(
            filtros.fechaInicio,
            filtros.fechaFin
          )
        },
        relations: ['id_insumo']
      });

      // Obtener salidas del cultivo
      const salidas = await this.salidaRepository.find({
        where: {
          id_cultivo: Number(filtros.cultivoId),
          fecha_salida: Between(
            filtros.fechaInicio,
            filtros.fechaFin
          )
        },
        relations: ['insumo', 'id_categorias']
      });

      // Mapear ingresos
      const ingresosMapeados = ingresos.map(ing => ({
        concepto: ing.descripcion || 'Ingreso',
        monto: Number(ing.monto) || 0,
        fecha: new Date(ing.fecha_ingreso)
      }));

      // Mapear salidas como costos
      const costosMapeados = salidas.map(salida => ({
        tipo: 'costo',
        monto: (Number(salida.valor_unidad) || 0) * (Number(salida.cantidad) || 0),
        fecha: new Date(salida.fecha_salida),
        descripcion: salida.nombre || 'Salida'
      }));

      // También incluir costos de actividades
      const actividades = await this.actividadRepository.find({
        where: {
          id_cultivo: Number(filtros.cultivoId),
          fecha: Between(
            new Date(filtros.fechaInicio),
            new Date(filtros.fechaFin)
          )
        }
      });

      const costosActividades = actividades
        .filter(act => act.costo_mano_obra || act.costo_maquinaria)
        .map(act => {
          const costoManoObra = parseFloat(act.costo_mano_obra || '0');
          const costoMaquinaria = parseFloat(act.costo_maquinaria || '0');
          const costoTotal = costoManoObra + costoMaquinaria;
          const horasTrabajadas = parseFloat(act.horas_trabajadas || '0');
          const tarifaHora = parseFloat(act.tarifa_hora || '0');
          
          return {
            tipo: 'costo_actividad',
            monto: costoTotal,
            fecha: act.fecha,
            descripcion: act.tipo_actividad || 'Actividad',
            detalles: {
              actividad: act.tipo_actividad,
              responsable: act.responsable,
              costoManoObra,
              costoMaquinaria,
              horasTrabajadas,
              tarifaHora,
              detalles: act.detalles
            }
          };
        });

      // Combinar todos los costos
      const todosLosCostos = [...costosMapeados, ...costosActividades];
      
      const totalIngresos = ingresosMapeados.reduce((sum, item) => sum + item.monto, 0);
      const totalCostos = todosLosCostos.reduce((sum, item) => sum + item.monto, 0);
      
      return {
        ingresos: ingresosMapeados,
        costos: todosLosCostos,
        resumen: {
          costosTotales: totalCostos,
          ingresosTotales: totalIngresos,
          margenBruto: totalIngresos - totalCostos,
          margenNeto: totalIngresos - totalCostos,
          roi: totalCostos > 0 ? ((totalIngresos - totalCostos) / totalCostos) * 100 : 0
        }
      };
    } catch (error) {
      console.error('[CropReportService] Error al obtener datos financieros', error);
      return {
        ingresos: [],
        costos: [],
        resumen: {
          costosTotales: 0,
          ingresosTotales: 0,
          margenBruto: 0,
          margenNeto: 0,
          roi: 0
        }
      };
    }
  }

  private async obtenerDatosInventario(filtros: ReportFiltersDto): Promise<InventarioReporte> {
    try {
      // Obtener todo el inventario sin filtrar por fecha para asegurar datos
      const inventario = await this.inventarioRepository.find({
        relations: ['insumo']
      });

      const insumosMapeados = inventario.map(item => ({
        id: item.id_inventario.toString(),
        nombre: item.insumo?.nombre_insumo || 'Sin nombre',
        cantidad: Number(item.cantidad_stock) || 0,
        unidad: item.unidad_medida || 'un',
        costoUnitario: 0, 
        costoTotal: 0,
        proveedor: 'No especificado' 
      }));

      return {
        insumos: insumosMapeados,
        resumen: {
          totalInsumos: insumosMapeados.length,
          valorTotal: 0, 
          insumosPorCategoria: insumosMapeados.reduce((acc, item) => {
            const categoria = item.nombre.split(' ')[0] || 'Otros';
            acc[categoria] = (acc[categoria] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener inventario', error.stack);
      return {
        insumos: [],
        resumen: {
          totalInsumos: 0,
          valorTotal: 0,
          insumosPorCategoria: {}
        }
      };
    }
  }

  private async obtenerDatosTrazabilidad(filtros: ReportFiltersDto) {
    try {
      // Obtener datos del cultivo específico
      const cultivo = await this.cultivoRepository.findOne({
        where: { id_cultivo: Number(filtros.cultivoId) },
        relations: ['lote']
      });

      if (!cultivo) {
        return {
          cultivo: null,
          mensaje: 'No se encontró el cultivo especificado'
        };
      }

      // Obtener actividades relacionadas con el cultivo para trazabilidad
      const actividades = await this.actividadRepository.find({
        where: { id_cultivo: Number(filtros.cultivoId) },
        order: { fecha: 'ASC' }
      });

      // Formatear datos de trazabilidad
      const trazabilidad = {
        id: cultivo.id_cultivo,
        nombre: cultivo.nombre_cultivo,
        tipo: cultivo.tipo_cultivo,
        fechaSiembra: cultivo.fecha_siembra,
        fechaCosechaEstimada: cultivo.fecha_cosecha_estimada,
        estado: cultivo.estado_cultivo,
        lote: cultivo.lote?.nombre_lote || cultivo.lote?.descripcion || 'No asignado',
        observaciones: cultivo.observaciones || 'Sin observaciones',
        fechaCreacion: cultivo.fecha_siembra,
        actividades: actividades.map(act => ({
          fecha: act.fecha,
          tipo: act.tipo_actividad,
          descripcion: act.detalles,
          estado: act.estado
        }))
      };

      return {
        cultivo: trazabilidad,
        mensaje: 'Datos de trazabilidad obtenidos exitosamente'
      };

    } catch (error) {
      this.logger.error('[CropReportService] Error al obtener datos de trazabilidad', error);
      return {
        cultivo: null,
        mensaje: 'Error al obtener datos de trazabilidad'
      };
    }
  }

  private calcularDesviacionEstandar(valores: number[], media: number): number {
    if (valores.length === 0) return 0;
    const cuadrados = valores.map(valor => Math.pow(valor - media, 2));
    const sumaCuadrados = cuadrados.reduce((sum, valor) => sum + valor, 0);
    return Math.sqrt(sumaCuadrados / valores.length);
  }

  private async obtenerAlertas(
    filtros: ReportFiltersDto, 
    cultivoId: number
  ): Promise<{ lista: AlertaReporte[]; resumen: { total: number; porTipo: Record<string, number>; noResueltas: number } }> {
    try {
      const alertas = await this.alertaRepository.find({
        where: {
          fecha: Between(
            format(new Date(filtros.fechaInicio), 'yyyy-MM-dd'),
            format(new Date(filtros.fechaFin), 'yyyy-MM-dd')
          )
        },
        relations: ['sensor']
      });

      const alertasMapeadas: AlertaReporte[] = alertas.map(a => {
        const tipo: 'advertencia' | 'peligro' | 'informativo' = 
          a.tipo_alerta === 'advertencia' ? 'advertencia' :
          a.tipo_alerta === 'peligro' ? 'peligro' :
          'informativo';
          
        const alerta: AlertaReporte = {
          id: a.id_alerta.toString(),
          fecha: new Date(a.fecha),
          tipo,
          mensaje: a.descripcion,
          resuelta: false
        };

        if (a.sensor) {
          alerta.sensorId = a.sensor.id_sensor?.toString();
          alerta.sensorNombre = a.sensor.tipo_sensor;
        }

        return alerta;
      });

      const noResueltas = alertasMapeadas.filter(a => !a.resuelta).length;
      const porTipo = alertasMapeadas.reduce((acc, alerta) => {
        acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        lista: alertasMapeadas,
        resumen: {
          total: alertasMapeadas.length,
          porTipo,
          noResueltas
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener alertas', error.stack);
      return {
        lista: [],
        resumen: {
          total: 0,
          porTipo: {},
          noResueltas: 0
        }
      };
    }
  }

  private async generarAnalisis(reporte: ReporteCultivo) {
    const { metricas, actividades, finanzas, inventario, alertas } = reporte;
    const analisis: ReporteCultivo['analisis'] = {
      rendimiento: 70,
      salud: 80,
      recomendaciones: [],
      puntosCriticos: []
    };

    // Análisis de métricas
    Object.entries(metricas).forEach(([tipo, datos]) => {
      if (datos?.resumen?.alertas > 0) {
        analisis.puntosCriticos.push({
          tipo: 'alerta',
          mensaje: `Se detectaron ${datos.resumen.alertas} alertas en ${tipo}`,
          accionRecomendada: 'Revisar las lecturas de los sensores y tomar acciones correctivas.'
        });
      }
    });

    const costoActividades = actividades?.resumen?.costoTotal || 0;
    if (costoActividades > 10000) {
      analisis.recomendaciones.push(
        'Los costos de actividades son altos. Considere optimizar los recursos utilizados.'
      );
    }

    const margenBruto = finanzas?.resumen?.margenBruto || 0;
    if (margenBruto < 0) {
      analisis.puntosCriticos.push({
        tipo: 'riesgo',
        mensaje: 'El margen bruto es negativo',
        accionRecomendada: 'Revisar costos y estrategias de precios.'
      });
    }

    const valorInventario = inventario?.resumen?.valorTotal || 0;
    if (valorInventario > 5000) { 
      analisis.recomendaciones.push(
        'El valor del inventario es alto. Considere optimizar los niveles de stock.'
      );
    }

    const alertasNoResueltas = alertas?.resumen?.noResueltas || 0;
    if (alertasNoResueltas > 0) {
      analisis.puntosCriticos.push({
        tipo: 'alerta',
        mensaje: `Hay ${alertasNoResueltas} alertas sin resolver`,
        accionRecomendada: 'Revisar y atender las alertas pendientes.'
      });
    }

    return analisis;
  }

  private mapearTipoAlerta(nivel: string): 'advertencia' | 'peligro' | 'informativo' {
    switch (nivel?.toLowerCase()) {
      case 'alto':
      case 'critico':
        return 'peligro';
      case 'medio':
      case 'bajo':
        return 'advertencia';
      default:
        return 'informativo';
    }
  }

  private formatearFecha(fecha: Date): string {
    return format(fecha, 'yyyy-MM-dd HH:mm:ss');
  }

  async obtenerOpcionesFiltros() {
    try {
      const cultivos = await this.cultivoRepository
        .createQueryBuilder('cultivo')
        .select(['DISTINCT cultivo.tipo_cultivo as tipo', 'cultivo.id_cultivo as id'])
        .orderBy('tipo', 'ASC')
        .getRawMany();

      const años = await this.actividadRepository
        .createQueryBuilder('actividad')
        .select('DISTINCT EXTRACT(YEAR FROM actividad.fecha) as year')
        .orderBy('year', 'DESC')
        .getRawMany();

      return {
        tiposCultivo: cultivos,
        años: años.map(a => a.year),
        metricasDisponibles: [
          'temperatura',
          'humedad',
          'nivel_agua',
          'ph',
          'conductividad'
        ]
      };
    } catch (error) {
      this.logger.error('Error al obtener opciones de filtros', error);
      return {
        tiposCultivo: [],
        años: [],
        metricasDisponibles: []
      };
    }
  }
}