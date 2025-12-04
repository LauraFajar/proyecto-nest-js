import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { IotService } from './iot.service';
import { FinanzasService } from '../../finanzas/finanzas.service';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Ingreso } from '../../ingresos/entities/ingreso.entity';
import { Salida } from '../../salidas/entities/salida.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Sensor } from '../entities/sensor.entity';
import { Reading } from '../entities/reading.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Alerta } from '../../alertas/entities/alerta.entity';

@Injectable()
export class ComprehensiveReportsService {
  constructor(
    @InjectRepository(Actividad) private actividadesRepo: Repository<Actividad>,
    @InjectRepository(Cultivo) private cultivosRepo: Repository<Cultivo>,
    @InjectRepository(Ingreso) private ingresosRepo: Repository<Ingreso>,
    @InjectRepository(Salida) private salidasRepo: Repository<Salida>,
    @InjectRepository(Inventario) private inventarioRepo: Repository<Inventario>,
    @InjectRepository(Usuario) private usuariosRepo: Repository<Usuario>,
    @InjectRepository(Alerta) private alertasRepo: Repository<Alerta>,
    private iotService: IotService,
    private finanzasService: FinanzasService,
  ) {}

  async generateComprehensiveReport(params: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cultivos?: number[];
    incluir_actividades?: boolean;
    incluir_finanzas?: boolean;
    incluir_inventario?: boolean;
    incluir_iot?: boolean;
    incluir_alertas?: boolean;
  }): Promise<{ buffer: Buffer; format: 'pdf' | 'excel'; hasData: boolean }> {
    const {
      fecha_desde,
      fecha_hasta,
      cultivos = [],
      incluir_actividades = true,
      incluir_finanzas = true,
      incluir_inventario = true,
      incluir_iot = true,
      incluir_alertas = true
    } = params;

    // Collect data from all modules
    const reportData = await this.collectReportData({
      fecha_desde,
      fecha_hasta,
      cultivos,
      incluir_actividades,
      incluir_finanzas,
      incluir_inventario,
      incluir_iot,
      incluir_alertas
    });

    if (reportData.totalRecords === 0) {
      return {
        buffer: Buffer.from(''),
        format: 'pdf',
        hasData: false
      };
    }

    // Generate Excel version with multiple sheets
    return { ...await this.generateExcelReport(reportData), format: 'excel' };
  }

  async generateComprehensiveExcel(params: any): Promise<{ buffer: Buffer; hasData: boolean }> {
    const reportData = await this.collectReportData(params);
    
    if (reportData.totalRecords === 0) {
      return {
        buffer: Buffer.from(''),
        hasData: false
      };
    }

    return this.generateExcelReport(reportData);
  }

  async generateComprehensivePdf(params: any): Promise<{ buffer: Buffer; hasData: boolean }> {
    const reportData = await this.collectReportData(params);
    
    if (reportData.totalRecords === 0) {
      return {
        buffer: Buffer.from(''),
        hasData: false
      };
    }

    return this.generatePdfReport(reportData);
  }

  private async collectReportData(params: any): Promise<any> {
    const {
      fecha_desde,
      fecha_hasta,
      cultivos: cultivoIds = [],
      incluir_actividades,
      incluir_finanzas,
      incluir_inventario,
      incluir_iot,
      incluir_alertas
    } = params;

    const data = {
      header: {
        titulo: 'Reporte Completo del Proyecto AGROTIC',
        fecha_generacion: new Date(),
        periodo: `${fecha_desde || 'Inicio'} - ${fecha_hasta || 'Actual'}`,
        cultivos_seleccionados: cultivoIds
      },
      actividades: {
        enabled: incluir_actividades,
        data: [] as any[],
        resumen: null
      },
      trazabilidad_cultivos: {
        data: [] as any[],
        resumen: null
      },
      control_financiero: {
        enabled: incluir_finanzas,
        data: [] as any[],
        resumen: null
      },
      costos_mano_obra: {
        data: [] as any[],
        resumen: null
      },
      inventario_insumos: {
        enabled: incluir_inventario,
        data: [] as any[],
        resumen: null
      },
      datos_sensores: {
        enabled: incluir_iot,
        data: [] as any[],
        resumen: null
      },
      alertas: {
        enabled: incluir_alertas,
        data: [] as any[],
        resumen: null
      },
      totalRecords: 0
    };

    let totalRecords = 0;

    // 1. Activity History - HISTORIAL DE ACTIVIDADES
    if (incluir_actividades) {
      const actividadesQuery = this.actividadesRepo.createQueryBuilder('a')
        .leftJoinAndSelect('a.cultivo', 'cultivo')
        .leftJoinAndSelect('a.fotos', 'fotos')
        .leftJoinAndSelect('a.usuario', 'usuario');

      if (fecha_desde && fecha_hasta) {
        actividadesQuery.where('a.fecha BETWEEN :fecha_desde AND :fecha_hasta', {
          fecha_desde,
          fecha_hasta
        });
      }

      if (cultivoIds.length > 0) {
        actividadesQuery.andWhere('a.id_cultivo IN (:...cultivos)', { cultivos: cultivoIds });
      }

      actividadesQuery.orderBy('a.fecha', 'DESC');

      const actividades = await actividadesQuery.getMany();

      data.actividades.data = actividades.map(a => ({
        id: a.id_actividad,
        fecha: a.fecha,
        tipo: a.tipo_actividad,
        responsable: a.responsable || 'Sistema',
        detalles: a.detalles,
        estado: a.estado,
        costo_mano_obra: parseFloat(a.costo_mano_obra || '0'),
        horas_trabajadas: parseFloat(a.horas_trabajadas || '0'),
        tarifa_hora: parseFloat(a.tarifa_hora || '0'),
        costo_maquinaria: parseFloat(a.costo_maquinaria || '0'),
        cultivo: a.cultivo?.nombre_cultivo || 'Sin cultivo',
        modulo_origen: 'Actividades'
      }));

      data.actividades.resumen = {
        total_actividades: actividades.length,
        costo_total_mano_obra: data.actividades.data.reduce((sum, a) => sum + a.costo_mano_obra, 0),
        total_horas: data.actividades.data.reduce((sum, a) => sum + a.horas_trabajadas, 0),
        actividades_por_tipo: this.groupBy(data.actividades.data, 'tipo'),
        actividades_por_responsable: this.groupBy(data.actividades.data, 'responsable'),
        actividades_mas_frecuentes: this.getTopActivities(data.actividades.data, 'tipo', 3),
        usuarios_mas_activos: this.getTopActivities(data.actividades.data, 'responsable', 3)
      } as any;

      totalRecords += actividades.length;
    }

    // 2. Crop Traceability
    const cultivosQuery = this.cultivosRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.lote', 'lote')
      .leftJoinAndSelect('c.insumo', 'insumo')
      .leftJoinAndSelect('c.actividades', 'actividades');

    if (cultivoIds.length > 0) {
      cultivosQuery.where('c.id_cultivo IN (:...cultivos)', { cultivos: cultivoIds });
    }

    const cultivos = await cultivosQuery.getMany();

    data.trazabilidad_cultivos.data = cultivos.map(c => ({
      id: c.id_cultivo,
      nombre: c.nombre_cultivo,
      tipo: c.tipo_cultivo,
      fecha_siembra: c.fecha_siembra,
      fecha_cosecha_estimada: c.fecha_cosecha_estimada,
      fecha_cosecha_real: c.fecha_cosecha_real,
      estado: c.estado_cultivo,
      observaciones: c.observaciones,
      lote: c.lote?.nombre_lote || 'Sin lote',
      insumo_principal: c.insumo?.nombre_insumo || 'No especificado',
      total_actividades: c.actividades?.length || 0,
      ciclo_dias: c.fecha_siembra && c.fecha_cosecha_real ?
        Math.ceil((new Date(c.fecha_cosecha_real).getTime() - new Date(c.fecha_siembra).getTime()) / (1000 * 60 * 60 * 24)) : null
    }));

    data.trazabilidad_cultivos.resumen = {
      total_cultivos: cultivos.length,
      cultivos_por_tipo: this.groupBy(data.trazabilidad_cultivos.data, 'tipo'),
      cultivos_por_estado: this.groupBy(data.trazabilidad_cultivos.data, 'estado'),
      cultivos_completados: cultivos.filter(c => c.estado_cultivo === 'cosechado').length,
      promedio_ciclo_dias: data.trazabilidad_cultivos.data
        .filter(c => c.ciclo_dias !== null)
        .reduce((sum, c, _, arr) => sum + c.ciclo_dias / arr.length, 0)
    } as any;

    totalRecords += cultivos.length;

    // 3. Financial Control
    if (incluir_finanzas) {
      // Get financial data for each crop or overall
      for (const cultivoId of cultivoIds) {
        const from = fecha_desde || '2020-01-01';
        const to = fecha_hasta || new Date().toISOString().split('T')[0];

        const resumenFinanciero = await this.finanzasService.getResumen(cultivoId, from, to, 'mes');

        data.control_financiero.data.push({
          cultivo_id: cultivoId,
          ...resumenFinanciero
        });
      }

      if (data.control_financiero.data.length === 0 && cultivos.length > 0) {
        // General financial summary if no specific crops
        const from = fecha_desde || '2020-01-01';
        const to = fecha_hasta || new Date().toISOString().split('T')[0];

        // Get overall financial data
        const ingresos = await this.ingresosRepo
          .createQueryBuilder('i')
          .select('COALESCE(SUM(i.monto), 0)', 'total')
          .where('i.fecha_ingreso BETWEEN :from AND :to', { from, to })
          .getRawOne();

        const salidas = await this.salidasRepo
          .createQueryBuilder('s')
          .select('COALESCE(SUM(s.cantidad * COALESCE(s.valor_unidad, 0)), 0)', 'total')
          .where('s.fecha_salida BETWEEN :from AND :to', { from, to })
          .getRawOne();

        const actividades = await this.actividadesRepo
          .createQueryBuilder('a')
          .select(
            "COALESCE(SUM(COALESCE(a.costo_mano_obra, '0')::numeric + COALESCE(a.costo_maquinaria, '0')::numeric), 0)",
            'total'
          )
          .where('a.fecha BETWEEN :from AND :to', { from, to })
          .getRawOne();

        const totalIngresos = parseFloat(ingresos?.total || '0');
        const totalSalidas = parseFloat(salidas?.total || '0');
        const totalActividades = parseFloat(actividades?.total || '0');
        const totalEgresos = totalSalidas + totalActividades;
        const margen = totalIngresos - totalEgresos;

        data.control_financiero.data = [{
          ingresosTotal: totalIngresos.toFixed(2),
          egresosTotal: totalEgresos.toFixed(2),
          margenTotal: margen.toFixed(2),
          categoriasGasto: [
            { nombre: 'Insumos/Salidas', total: totalSalidas.toFixed(2) },
            { nombre: 'Actividades', total: totalActividades.toFixed(2) }
          ],
          series: [] // Could be populated with time-series data
        }];
      }

      data.control_financiero.resumen = {
        total_ingresos: data.control_financiero.data.reduce((sum, item) => sum + parseFloat(item.ingresosTotal || '0'), 0),
        total_egresos: data.control_financiero.data.reduce((sum, item) => sum + parseFloat(item.egresosTotal || '0'), 0),
        margen_total: data.control_financiero.data.reduce((sum, item) => sum + parseFloat(item.margenTotal || '0'), 0),
        rentabilidad_promedio: data.control_financiero.data.length > 0 ?
          (data.control_financiero.data.reduce((sum, item) => {
            const ingresos = parseFloat(item.ingresosTotal || '0');
            const egresos = parseFloat(item.egresosTotal || '0');
            return sum + (ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : 0);
          }, 0) / data.control_financiero.data.length).toFixed(2) : '0.00'
      } as any;

      totalRecords += data.control_financiero.data.length;
    }

    // 4. Labor Costs
    if (incluir_actividades && data.actividades.data.length > 0) {
      data.costos_mano_obra.data = data.actividades.data.map(a => ({
        actividad_id: a.id,
        fecha: a.fecha,
        responsable: a.responsable,
        tipo_actividad: a.tipo,
        horas_trabajadas: a.horas_trabajadas,
        tarifa_hora: a.tarifa_hora,
        costo_total: a.costo_mano_obra,
        cultivo: a.cultivo
      }));

      data.costos_mano_obra.resumen = {
        costo_total_labor: data.costos_mano_obra.data.reduce((sum, item) => sum + item.costo_total, 0),
        total_horas_trabajadas: data.costos_mano_obra.data.reduce((sum, item) => sum + item.horas_trabajadas, 0),
        costo_promedio_hora: data.costos_mano_obra.data.length > 0 ?
          (data.costos_mano_obra.data.reduce((sum, item) => sum + item.tarifa_hora, 0) / data.costos_mano_obra.data.length).toFixed(2) : '0.00',
        costos_por_responsable: this.groupBySum(data.costos_mano_obra.data, 'responsable', 'costo_total'),
        costos_por_tipo_actividad: this.groupBySum(data.costos_mano_obra.data, 'tipo_actividad', 'costo_total')
      } as any;

      totalRecords += data.costos_mano_obra.data.length;
    }

    // 5. Inventory
    if (incluir_inventario) {
      const inventario = await this.inventarioRepo.find({
        relations: ['insumo'],
        where: fecha_desde && fecha_hasta ? {
          fecha: fecha_desde
        } : {}
      });

      data.inventario_insumos.data = inventario.map(item => ({
        id: item.id_inventario,
        insumo: item.insumo?.nombre_insumo || 'Sin nombre',
        categoria: item.insumo?.id_categoria?.nombre || 'Sin categoría',
        cantidad_stock: item.cantidad_stock,
        unidad_medida: item.unidad_medida,
        fecha_actualizacion: item.fecha,
        valor_estimado: 0, // Remove precio_unitario as it doesn't exist in the entity
        estado_stock: this.getStockStatus(item.cantidad_stock)
      }));

      data.inventario_insumos.resumen = {
        total_items: inventario.length,
        valor_total_inventario: data.inventario_insumos.data.reduce((sum, item) => sum + item.valor_estimado, 0),
        items_criticos: data.inventario_insumos.data.filter(item => item.estado_stock === 'Crítico').length,
        items_bajo_stock: data.inventario_insumos.data.filter(item => item.estado_stock === 'Bajo').length,
        items_normal: data.inventario_insumos.data.filter(item => item.estado_stock === 'Normal').length,
        categorias_distribucion: this.groupBy(data.inventario_insumos.data, 'categoria')
      } as any;

      totalRecords += inventario.length;
    }

    // 6. IoT Sensor Data
    if (incluir_iot) {
    try {
      const iotParams = { fecha_desde, fecha_hasta };
      // Check if getExportData is public or make it public in IotService
      const iotData = await (this.iotService as any).getExportData(iotParams);
        
        data.datos_sensores.data = iotData;
        data.datos_sensores.resumen = {
          total_lecturas: iotData.length,
          sensores_activos: [...new Set(iotData.map(d => d.cultivo))].length,
          temperatura_promedio: this.calculateAverage(iotData.filter(d => d.temperatura !== undefined).map(d => d.temperatura)),
          humedad_aire_promedio: this.calculateAverage(iotData.filter(d => d.humedad_aire !== undefined).map(d => d.humedad_aire)),
          humedad_suelo_promedio: this.calculateAverage(iotData.filter(d => d.humedad_suelo !== undefined).map(d => d.humedad_suelo)),
          activaciones_bomba: iotData.filter(d => d.bomba_estado === 'ENCENDIDA').length
        } as any;

        totalRecords += iotData.length;
      } catch (error) {
        console.error('Error fetching IoT data:', error);
        data.datos_sensores.enabled = false;
      }
    }

    // 7. Alerts
    if (incluir_alertas) {
      const alertasQuery = this.alertasRepo.createQueryBuilder('alerta')
        .leftJoinAndSelect('alerta.sensor', 'sensor')
        .leftJoinAndSelect('alerta.usuario', 'usuario')
        .where('1=1'); // Base condition

      if (fecha_desde && fecha_hasta) {
        alertasQuery.andWhere('DATE(alerta.created_at) BETWEEN :fecha_desde AND :fecha_hasta', {
          fecha_desde,
          fecha_hasta
        });
      }

      alertasQuery.orderBy('alerta.created_at', 'DESC');

      const alertas = await alertasQuery.getMany();

      data.alertas.data = alertas.map(alerta => ({
        id: alerta.id_alerta,
        titulo: `Alerta ${alerta.tipo_alerta}`,
        descripcion: alerta.descripcion,
        tipo: alerta.tipo_alerta,
        prioridad: this.determinePriority(alerta.tipo_alerta),
        estado: 'activa',
        fecha_creacion: alerta.created_at,
        fecha: alerta.fecha,
        hora: alerta.hora,
        sensor: alerta.sensor?.tipo_sensor || 'N/A',
        usuario: alerta.usuario?.nombres || 'Sistema'
      }));

      data.alertas.resumen = {
        total_alertas: alertas.length,
        alertas_criticas: alertas.filter(a => this.determinePriority(a.tipo_alerta) === 'alta').length,
        alertas_pendientes: alertas.length, // All alerts are considered pending for now
        alertas_resueltas: 0,
        alertas_por_tipo: this.groupBy(data.alertas.data, 'tipo'),
        alertas_por_prioridad: this.groupBy(data.alertas.data, 'prioridad')
      } as any;

      totalRecords += alertas.length;
    }

    data.totalRecords = totalRecords;
    return data;
  }

  private async generateExcelReport(reportData: any): Promise<{ buffer: Buffer; hasData: boolean }> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AGROTIC IoT Dashboard';
    workbook.created = new Date();

    // Define styles
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    const dataStyle = {
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // Sheet 1: Executive Summary
    this.createExecutiveSummarySheet(workbook, reportData, headerStyle, dataStyle);

    // Sheet 2: Activity History
    if (reportData.actividades.enabled && reportData.actividades.data.length > 0) {
      this.createActivitiesSheet(workbook, reportData.actividades, headerStyle, dataStyle);
    }

    // Sheet 3: Crop Traceability
    if (reportData.trazabilidad_cultivos.data.length > 0) {
      this.createCropsSheet(workbook, reportData.trazabilidad_cultivos, headerStyle, dataStyle);
    }

    // Sheet 4: Financial Control
    if (reportData.control_financiero.enabled && reportData.control_financiero.data.length > 0) {
      this.createFinancialSheet(workbook, reportData.control_financiero, headerStyle, dataStyle);
    }

    // Sheet 5: Labor Costs
    if (reportData.costos_mano_obra.data.length > 0) {
      this.createLaborCostsSheet(workbook, reportData.costos_mano_obra, headerStyle, dataStyle);
    }

    // Sheet 6: Inventory
    if (reportData.inventario_insumos.enabled && reportData.inventario_insumos.data.length > 0) {
      this.createInventorySheet(workbook, reportData.inventario_insumos, headerStyle, dataStyle);
    }

    // Sheet 7: IoT Sensor Data
    if (reportData.datos_sensores.enabled && reportData.datos_sensores.data.length > 0) {
      this.createIoTDataSheet(workbook, reportData.datos_sensores, headerStyle, dataStyle);
    }

    // Sheet 8: Alerts
    if (reportData.alertas.enabled && reportData.alertas.data.length > 0) {
      this.createAlertsSheet(workbook, reportData.alertas, headerStyle, dataStyle);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), hasData: true };
  }

  private async generatePdfReport(reportData: any): Promise<{ buffer: Buffer; hasData: boolean }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 40,
          info: {
            Title: 'Reporte Completo AGROTIC',
            Author: 'AGROTIC IoT Dashboard',
            Subject: 'Reporte Integral del Proyecto',
            Keywords: 'AGROTIC, Agricultura, IoT, Reporte, Completo'
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), hasData: true }));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).fillColor('#1976d2').text('🌱 AGROTIC', { align: 'center' });
        doc.fontSize(16).fillColor('#2e7d32').text('Sistema Inteligente de Monitoreo Agrícola', { align: 'center' });
        doc.moveDown();
        
        // Report title
        doc.fontSize(20).fillColor('#333').text(reportData.header.titulo, { align: 'center' });
        doc.moveDown();
        
        // Report metadata
        doc.fontSize(12).fillColor('#666');
        doc.text(`📅 Fecha de generación: ${reportData.header.fecha_generacion.toLocaleString('es-CO')}`);
        doc.text(`📊 Período: ${reportData.header.periodo}`);
        doc.text(`📈 Total de registros: ${reportData.totalRecords}`);
        doc.moveDown();

        // Table of Contents
        doc.fontSize(16).fillColor('#1976d2').text('📋 ÍNDICE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333');
        
        let sectionNum = 1;
        if (reportData.actividades.enabled) {
          doc.text(`${sectionNum++}. Historial de Actividades`);
        }
        if (reportData.trazabilidad_cultivos.data.length > 0) {
          doc.text(`${sectionNum++}. Trazabilidad de Cultivos`);
        }
        if (reportData.control_financiero.enabled) {
          doc.text(`${sectionNum++}. Control Financiero`);
        }
        if (reportData.costos_mano_obra.data.length > 0) {
          doc.text(`${sectionNum++}. Costos por Mano de Obra`);
        }
        if (reportData.inventario_insumos.enabled) {
          doc.text(`${sectionNum++}. Inventario de Insumos`);
        }
        if (reportData.datos_sensores.enabled) {
          doc.text(`${sectionNum++}. Datos de Sensores IoT`);
        }
        if (reportData.alertas.enabled) {
          doc.text(`${sectionNum++}. Alertas del Sistema`);
        }

        doc.addPage();

        // Executive Summary
        doc.fontSize(16).fillColor('#1976d2').text('📊 RESUMEN EJECUTIVO', { underline: true });
        doc.moveDown();

        this.addPdfSection(doc, 'Actividades', reportData.actividades.resumen);
        this.addPdfSection(doc, 'Cultivos', reportData.trazabilidad_cultivos.resumen);
        this.addPdfSection(doc, 'Finanzas', reportData.control_financiero.resumen);
        this.addPdfSection(doc, 'Inventario', reportData.inventario_insumos.resumen);
        this.addPdfSection(doc, 'Sensores IoT', reportData.datos_sensores.resumen);
        this.addPdfSection(doc, 'Alertas', reportData.alertas.resumen);

        // Detailed sections
        sectionNum = 1;
        
        // Activities
        if (reportData.actividades.enabled && reportData.actividades.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. HISTORIAL DE ACTIVIDADES`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.actividades.data, [
            'Fecha', 'Tipo', 'Responsable', 'Detalles', 'Estado', 'Costo', 'Horas'
          ]);
          doc.moveDown();
        }

        // Crops
        if (reportData.trazabilidad_cultivos.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. TRAZABILIDAD DE CULTIVOS`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.trazabilidad_cultivos.data, [
            'Nombre', 'Tipo', 'Estado', 'Fecha Siembra', 'Fecha Cosecha', 'Lote'
          ]);
          doc.moveDown();
        }

        // Financial Data
        if (reportData.control_financiero.enabled && reportData.control_financiero.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. CONTROL FINANCIERO`, { underline: true });
          this.addPdfFinancialSummary(doc, reportData.control_financiero);
          doc.moveDown();
        }

        // Labor Costs
        if (reportData.costos_mano_obra.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. COSTOS POR MANO DE OBRA`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.costos_mano_obra.data, [
            'Fecha', 'Responsable', 'Tipo', 'Horas', 'Tarifa/Hora', 'Costo Total'
          ]);
          doc.moveDown();
        }

        // Inventory
        if (reportData.inventario_insumos.enabled && reportData.inventario_insumos.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. INVENTARIO DE INSUMOS`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.inventario_insumos.data, [
            'Insumo', 'Categoría', 'Stock', 'Unidad', 'Estado', 'Valor Est.'
          ]);
          doc.moveDown();
        }

        // IoT Data
        if (reportData.datos_sensores.enabled && reportData.datos_sensores.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. DATOS DE SENSORES IOT`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.datos_sensores.data, [
            'Fecha', 'Temperatura', 'Humedad Aire', 'Humedad Suelo', 'Estado Bomba', 'Cultivo'
          ]);
          doc.moveDown();
        }

        // Alerts
        if (reportData.alertas.enabled && reportData.alertas.data.length > 0) {
          if (doc.y > 650) doc.addPage();
          doc.fontSize(16).fillColor('#1976d2').text(`${sectionNum++}. ALERTAS DEL SISTEMA`, { underline: true });
          this.addDetailedTableToPdf(doc, reportData.alertas.data, [
            'Fecha', 'Título', 'Tipo', 'Prioridad', 'Estado', 'Descripción'
          ]);
          doc.moveDown();
        }

        // Footer
        this.addPdfFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper methods for Excel sheets
  private createExecutiveSummarySheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📋 Resumen Ejecutivo');

    // Title
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = data.header.titulo;
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1976D2' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'center' };

    // Report info
    sheet.getCell('A3').value = '📅 Información del Reporte';
    sheet.getCell('A3').font = { size: 12, bold: true, color: { argb: 'FF1976D2' } };

    const reportInfo = [
      ['Fecha de Generación:', data.header.fecha_generacion.toLocaleString('es-CO')],
      ['Período:', data.header.periodo],
      ['Total de Registros:', data.totalRecords],
      ['Cultivos Incluidos:', data.header.cultivos_seleccionados.join(', ') || 'Todos']
    ];

    reportInfo.forEach((row, index) => {
      sheet.getCell(`A${5 + index}`).value = row[0];
      sheet.getCell(`B${5 + index}`).value = row[1];
    });

    // Key metrics
    let row = 10;
    if (data.actividades.enabled) {
      sheet.getCell(`A${row}`).value = '📊 Actividades';
      sheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FF1976D2' } };
      row++;
      sheet.getCell(`A${row}`).value = 'Total:';
      sheet.getCell(`B${row}`).value = data.actividades.resumen?.total_actividades || 0;
      row++;
      sheet.getCell(`A${row}`).value = 'Costo Total:';
      sheet.getCell(`B${row}`).value = `$${(data.actividades.resumen?.costo_total_mano_obra || 0).toFixed(2)}`;
      row += 2;
    }

    if (data.control_financiero.enabled) {
      sheet.getCell(`A${row}`).value = '💰 Finanzas';
      sheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FF1976D2' } };
      row++;
      sheet.getCell(`A${row}`).value = 'Ingresos Totales:';
      sheet.getCell(`B${row}`).value = `$${(data.control_financiero.resumen?.total_ingresos || 0).toFixed(2)}`;
      row++;
      sheet.getCell(`A${row}`).value = 'Egresos Totales:';
      sheet.getCell(`B${row}`).value = `$${(data.control_financiero.resumen?.total_egresos || 0).toFixed(2)}`;
      row++;
      sheet.getCell(`A${row}`).value = 'Margen:';
      sheet.getCell(`B${row}`).value = `$${(data.control_financiero.resumen?.margen_total || 0).toFixed(2)}`;
      row += 2;
    }

    sheet.columns = [
      { width: 25 }, { width: 20 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  private createActivitiesSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📅 Historial Actividades');

    const headers = ['Fecha', 'Tipo', 'Responsable', 'Detalles', 'Estado', 'Costo M.O.', 'Horas', 'Tarifa/Hora', 'Costo Maq.', 'Cultivo'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.fecha,
        item.tipo,
        item.responsable,
        item.detalles,
        item.estado,
        item.costo_mano_obra,
        item.horas_trabajadas,
        item.tarifa_hora,
        item.costo_maquinaria,
        item.cultivo
      ]);
      row.eachCell(cell => cell.style = dataStyle);
    });

    sheet.autoFilter = 'A1:J1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 12 }, { width: 15 }, { width: 15 }, { width: 25 },
      { width: 12 }, { width: 12 }, { width: 8 }, { width: 10 }, { width: 12 }, { width: 15 }
    ];
  }

  private createCropsSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('🌱 Trazabilidad Cultivos');

    const headers = ['Nombre', 'Tipo', 'Estado', 'Fecha Siembra', 'Fecha Cosecha Est.', 'Fecha Cosecha Real', 'Lote', 'Insumo', 'Actividades', 'Ciclo (días)'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.nombre,
        item.tipo,
        item.estado,
        item.fecha_siembra,
        item.fecha_cosecha_estimada,
        item.fecha_cosecha_real,
        item.lote,
        item.insumo_principal,
        item.total_actividades,
        item.ciclo_dias
      ]);
      row.eachCell(cell => cell.style = dataStyle);
    });

    sheet.autoFilter = 'A1:J1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 20 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 10 }
    ];
  }

  private createFinancialSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('💰 Control Financiero');

    const headers = ['Cultivo ID', 'Ingresos Total', 'Egresos Total', 'Margen Total'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.cultivo_id,
        `$${parseFloat(item.ingresosTotal || '0').toFixed(2)}`,
        `$${parseFloat(item.egresosTotal || '0').toFixed(2)}`,
        `$${parseFloat(item.margenTotal || '0').toFixed(2)}`
      ]);
      row.eachCell(cell => cell.style = dataStyle);
    });

    sheet.autoFilter = 'A1:D1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [{ width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }];
  }

  private createLaborCostsSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('👷 Costos Mano de Obra');

    const headers = ['Fecha', 'Responsable', 'Tipo Actividad', 'Horas', 'Tarifa/Hora', 'Costo Total', 'Cultivo'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.fecha,
        item.responsable,
        item.tipo_actividad,
        item.horas_trabajadas,
        `$${item.tarifa_hora.toFixed(2)}`,
        `$${item.costo_total.toFixed(2)}`,
        item.cultivo
      ]);
      row.eachCell(cell => cell.style = dataStyle);
    });

    sheet.autoFilter = 'A1:G1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 12 }, { width: 15 }, { width: 15 }, { width: 8 }, 
      { width: 10 }, { width: 12 }, { width: 15 }
    ];
  }

  private createInventorySheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📦 Inventario Insumos');

    const headers = ['Insumo', 'Categoría', 'Stock Actual', 'Unidad', 'Estado', 'Valor Estimado', 'Fecha Actualización'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.insumo,
        item.categoria,
        item.cantidad_stock,
        item.unidad_medida,
        item.estado_stock,
        `$${item.valor_estimado.toFixed(2)}`,
        item.fecha_actualizacion
      ]);
      row.eachCell(cell => {
        cell.style = dataStyle;
        if (cell.col === 5) { // Estado column
          if (cell.value === 'Crítico') cell.font = { color: { argb: 'FFFF0000' } };
          else if (cell.value === 'Bajo') cell.font = { color: { argb: 'FFFFA500' } };
        }
      });
    });

    sheet.autoFilter = 'A1:G1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 20 }, { width: 15 }, { width: 12 }, { width: 10 }, 
      { width: 12 }, { width: 15 }, { width: 15 }
    ];
  }

  private createIoTDataSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('📡 Datos Sensores IoT');

    const headers = ['Fecha/Hora', 'Temperatura (°C)', 'Humedad Aire (%)', 'Humedad Suelo (%)', 'Estado Bomba', 'Cultivo'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.slice(0, 1000).forEach(item => { // Limit to 1000 rows for performance
      const row = sheet.addRow([
        item.timestamp,
        item.temperatura?.toFixed(1) || '-',
        item.humedad_aire?.toFixed(1) || '-',
        item.humedad_suelo?.toFixed(1) || '-',
        item.bomba_estado || '-',
        item.cultivo || 'General'
      ]);
      row.eachCell(cell => cell.style = dataStyle);
    });

    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 15 }
    ];
  }

  private createAlertsSheet(workbook: any, data: any, headerStyle: any, dataStyle: any): void {
    const sheet = workbook.addWorksheet('🚨 Alertas del Sistema');

    const headers = ['Fecha Creación', 'Título', 'Tipo', 'Prioridad', 'Estado', 'Descripción'];
    const headerRow = sheet.addRow(headers);
    headers.forEach((_, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.style = headerStyle;
    });

    data.data.forEach(item => {
      const row = sheet.addRow([
        item.fecha_creacion,
        item.titulo,
        item.tipo,
        item.prioridad,
        item.estado,
        item.descripcion
      ]);
      row.eachCell(cell => {
        cell.style = dataStyle;
        if (cell.col === 4) { // Priority column
          if (cell.value === 'alta') cell.font = { color: { argb: 'FFFF0000' } };
          else if (cell.value === 'media') cell.font = { color: { argb: 'FFFFA500' } };
        }
      });
    });

    sheet.autoFilter = 'A1:F1';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = [
      { width: 18 }, { width: 25 }, { width: 15 }, { width: 10 }, { width: 12 }, { width: 30 }
    ];
  }

  // Helper methods for PDF generation
  private addPdfSection(doc: any, title: string, data: any): void {
    if (!data) return;
    
    doc.fontSize(12).fillColor('#1976d2').text(`${title}:`, { underline: true });
    doc.fontSize(10).fillColor('#333');
    
    Object.entries(data).forEach(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').toUpperCase();
      doc.text(`• ${displayKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    });
    
    doc.moveDown(0.5);
  }

  private addDetailedTableToPdf(doc: any, data: any[], columns: string[]): void {
    if (data.length === 0) return;
    
    // Table header
    doc.fontSize(10).fillColor('#fff');
    doc.rect(40, doc.y, 515, 20).fillAndStroke('#1976d2', '#1976d2');
    
    let colX = 50;
    const colWidth = 515 / columns.length;
    
    columns.forEach(col => {
      doc.text(col, colX, doc.y + 5);
      colX += colWidth;
    });
    
    doc.moveDown(1.5);
    doc.fontSize(9).fillColor('#333');
    
    // Table data
    const maxRows = Math.min(data.length, 30);
    for (let i = 0; i < maxRows; i++) {
      const item = data[i];
      const rowY = doc.y;
      
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(40, rowY - 2, 515, 18).fill('#f8f9fa');
      }
      
      colX = 50;
      columns.forEach((col, colIndex) => {
        const value = this.getValueFromItem(item, col);
        doc.text(value.toString(), colX, rowY + 2, { width: colWidth - 5 });
        colX += colWidth;
      });
      
      doc.moveDown(1.2);
      
      if (doc.y > 700) {
        doc.addPage();
      }
    }
    
    if (data.length > maxRows) {
      doc.text(`... y ${data.length - maxRows} registros más`);
    }
  }

  private addPdfFinancialSummary(doc: any, data: any): void {
    if (!data.data || data.data.length === 0) return;
    
    doc.fontSize(10).fillColor('#333');
    
    data.data.forEach((item, index) => {
      doc.text(`Cultivo ${item.cultivo_id || index + 1}:`, { underline: true });
      doc.text(`• Ingresos: $${parseFloat(item.ingresosTotal || '0').toFixed(2)}`);
      doc.text(`• Egresos: $${parseFloat(item.egresosTotal || '0').toFixed(2)}`);
      doc.text(`• Margen: $${parseFloat(item.margenTotal || '0').toFixed(2)}`);
      doc.moveDown(0.5);
    });
  }

  private addPdfFooter(doc: any): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8).fillColor('#999').text(
        'Generado por AGROTIC IoT Dashboard - Sistema de Monitoreo Agrícola',
        40,
        doc.page.height - 30
      );
      doc.text(`Página ${i + 1} de ${pageCount}`, 450, doc.page.height - 30);
    }
  }

  // Utility methods
  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  private groupBySum(array: any[], key: string, valueKey: string): any {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + item[valueKey];
      return result;
    }, {});
  }

  private calculateAverage(numbers: number[]): string {
    if (numbers.length === 0) return '0.00';
    const sum = numbers.reduce((a, b) => a + b, 0);
    return (sum / numbers.length).toFixed(2);
  }

  private getStockStatus(cantidad: number): string {
    if (cantidad <= 5) return 'Crítico';
    if (cantidad <= 20) return 'Bajo';
    return 'Normal';
  }

  private getValueFromItem(item: any, column: string): any {
    const columnMap: { [key: string]: string } = {
      'Fecha': 'fecha',
      'Tipo': 'tipo',
      'Responsable': 'responsable',
      'Detalles': 'detalles',
      'Estado': 'estado',
      'Costo': 'costo_mano_obra',
      'Horas': 'horas_trabajadas',
      'Tarifa/Hora': 'tarifa_hora',
      'Costo Maq.': 'costo_maquinaria',
      'Cultivo': 'cultivo',
      'Nombre': 'nombre',
      'Temperatura': 'temperatura',
      'Humedad Aire': 'humedad_aire',
      'Humedad Suelo': 'humedad_suelo',
      'Estado Bomba': 'bomba_estado',
      'Insumo': 'insumo',
      'Categoría': 'categoria',
      'Stock': 'cantidad_stock',
      'Unidad': 'unidad_medida',
      'Estado Stock': 'estado_stock',
      'Valor Est.': 'valor_estimado',
      'Fecha Actualización': 'fecha_actualizacion',
      'Título': 'titulo',
      'Prioridad': 'prioridad',
      'Descripción': 'descripcion',
      'Fecha Creación': 'fecha_creacion',
      'Sensor': 'sensor',
      'Usuario': 'usuario'
    };

    const field = columnMap[column] || column.toLowerCase().replace(/ /g, '_');
    return item[field] || '-';
  }

  private determinePriority(tipoAlerta: string): string {
    const highPriorityTypes = ['sensor_critico', 'temperatura_alta', 'humedad_baja'];
    const mediumPriorityTypes = ['humedad_alta', 'ventilacion', 'riego'];

    if (highPriorityTypes.includes(tipoAlerta)) return 'alta';
    if (mediumPriorityTypes.includes(tipoAlerta)) return 'media';
    return 'baja';
  }

  private getTopActivities(data: any[], field: string, limit: number): any {
    const counts: { [key: string]: number } = {};
    data.forEach(item => {
      const key = item[field];
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .reduce((result, [key, value]) => {
        result[key] = value;
        return result;
      }, {});
  }
}