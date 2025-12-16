import { Injectable } from '@nestjs/common';
import { ReporteCultivo } from '../interfaces/report.interface';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Chart } from 'chart.js';
import { registerables } from 'chart.js';
import { createCanvas } from 'canvas';
import * as moment from 'moment';

Chart.register(...registerables);

@Injectable()
export class ReportExporterService {
  private readonly FONT_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'assets',
    'fonts',
    'Arial.ttf'
  );

  async generarPdf(reporte: ReporteCultivo): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        this.configurarFuentes(doc);

        this.generarEncabezado(doc, reporte);

        this.generarResumen(doc, reporte);
        
        if (Object.keys(reporte.metricas).length > 0) {
          this.generarPaginaGraficas(doc, reporte.metricas);
        }
        
        if (Object.keys(reporte.metricas).length > 0) {
          this.generarMetricas(doc, reporte);
        }
        
        if (reporte.actividades) {
          this.generarActividades(doc, reporte.actividades);
        }
        
        if (reporte.finanzas) {
          this.generarFinanzas(doc, reporte.finanzas);
        }
        
        if (reporte.inventario) {
          this.generarInventario(doc, reporte.inventario);
        }
        
        if (reporte.alertas) {
          this.generarAlertas(doc, reporte.alertas);
        }
        
        if (reporte.trazabilidad) {
          this.generarTrazabilidad(doc, reporte.trazabilidad);
        }
        
        if (reporte.analisis) {
          this.generarAnalisis(doc, reporte.analisis);
        }

        this.generarPiePagina(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generarPaginaGraficas(doc: PDFKit.PDFDocument, metricas: any) {
    const entries = Object.entries(metricas);
    const cols = 2;
    const rows = 3;
    const cellW = 250;
    const cellH = 160;
    const gapX = 20;
    const gapY = 18;
    const maxCharts = cols * rows;
    
    let idxGlobal = 0;
    while (idxGlobal < entries.length) {
      doc.addPage();
      doc
        .fontSize(16)
        .fillColor('#2E7D32')
        .text('Gráficas de Sensores (vista resumida)', { underline: true })
        .moveDown(0.5);
      
      const marginLeft = 50;
      const marginTop = doc.y;
      const slice = entries.slice(idxGlobal, idxGlobal + maxCharts);
      
      slice.forEach(([nombre, datos]: [string, any], idx: number) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x0 = marginLeft + c * (cellW + gapX);
        const y0 = marginTop + r * (cellH + gapY);
        
        doc.strokeColor('#E0E0E0').lineWidth(1).rect(x0, y0, cellW, cellH).stroke();
        doc.fontSize(12).fillColor('#333333').text(nombre.toUpperCase(), x0 + 8, y0 + 6);
        
        const datosGrafico = (datos?.datos || []).slice(0, 12);
        if (datosGrafico.length === 0) {
          doc.fontSize(9).fillColor('#666666').text('Sin datos', x0 + 8, y0 + 24);
          return;
        }
        
        const valores = datosGrafico.map((d: any) => parseFloat(d.valor || 0));
        const maxValor = Math.max(...valores);
        const minValor = Math.min(...valores);
        
        const plotX = x0 + 10;
        const plotY = y0 + 30;
        const plotW = cellW - 20;
        const plotH = cellH - 50;
        
        doc.strokeColor('#495057').lineWidth(1.5);
        doc.moveTo(plotX, plotY).lineTo(plotX, plotY + plotH).stroke();
        doc.moveTo(plotX, plotY + plotH).lineTo(plotX + plotW, plotY + plotH).stroke();
        doc.strokeColor('#e9ecef').lineWidth(1);
        for (let i = 1; i <= 3; i++) {
          const yGrid = plotY + (i * plotH) / 4;
          doc.moveTo(plotX, yGrid).lineTo(plotX + plotW, yGrid).stroke();
        }
        
        const rango = maxValor - minValor;
        const getY = (v: number) => {
          if (rango <= 0) return plotY + plotH / 2;
          const norm = (v - minValor) / rango;
          return plotY + plotH - norm * plotH;
        };
        const puntos = datosGrafico.map((d: any, i: number) => {
          const x = plotX + i * (plotW / Math.max(1, datosGrafico.length - 1));
          const y = getY(parseFloat(d.valor || 0));
          return { x, y, fecha: new Date(d.fecha), valor: parseFloat(d.valor || 0) };
        });
        
        if (puntos.length > 0) {
          doc.strokeColor('#1976D2').lineWidth(2);
          doc.moveTo(puntos[0].x, puntos[0].y);
          for (let i = 1; i < puntos.length; i++) {
            doc.lineTo(puntos[i].x, puntos[i].y);
          }
          doc.stroke();
          puntos.forEach(p => {
            doc.fillColor('#1976D2').circle(p.x, p.y, 2).fill();
          });
        }
      });
      
      idxGlobal += maxCharts;
    }
  }

  async generarExcel(reporte: ReporteCultivo): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('Resumen');
    this.agregarHojaResumen(summarySheet, reporte);
    
    if (Object.keys(reporte.metricas).length > 0) {
      const metricsSheet = workbook.addWorksheet('Métricas');
      this.agregarHojaMetricas(metricsSheet, reporte.metricas);
    }
    if (reporte.actividades) {
      const activitiesSheet = workbook.addWorksheet('Actividades');
      this.agregarHojaActividades(activitiesSheet, reporte.actividades);
    }
    if (reporte.finanzas) {
      const financeSheet = workbook.addWorksheet('Finanzas');
      this.agregarHojaFinanzas(financeSheet, reporte.finanzas);
    }
    if (reporte.inventario) {
      const inventorySheet = workbook.addWorksheet('Inventario');
      this.agregarHojaInventario(inventorySheet, reporte.inventario);
    }
    if (reporte.alertas) {
      const alertsSheet = workbook.addWorksheet('Alertas');
      this.agregarHojaAlertas(alertsSheet, reporte.alertas);
    }
    if (reporte.trazabilidad) {
      const trazabilidadSheet = workbook.addWorksheet('Trazabilidad');
      this.agregarHojaTrazabilidad(trazabilidadSheet, reporte.trazabilidad);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  private configurarFuentes(doc: PDFKit.PDFDocument) {
    if (fs.existsSync(this.FONT_PATH)) {
      doc.registerFont('Arial', this.FONT_PATH);
      doc.font('Helvetica');
    }
  }

  private generarEncabezado(doc: PDFKit.PDFDocument, reporte: ReporteCultivo) {
    // Fondo decorativo para el encabezado
    doc.rect(0, 0, doc.page.width, 120).fill('#F8FFFE');
    
    // Línea decorativa superior
    doc
      .rect(0, 0, doc.page.width, 3)
      .fill('#2E7D32');
    
    // Agregar logo de AGROTIC
    this.agregarLogo(doc);
    
    // Contenedor principal del encabezado
    doc.y = 40;
    
    // Título principal con estilo
    doc
      .fontSize(28)
      .fillColor('#2E7D32')
      .font('Helvetica')
      .text('AGROTIC', { align: 'center' })
      .moveDown(0.2);
    
    doc
      .fontSize(18)
      .fillColor('#4CAF50')
      .font('Helvetica')
      .text('Sistema de Gestión Agrícola', { align: 'center' })
      .moveDown(0.4);
    
    // Separador decorativo
    doc
      .rect(150, doc.y, doc.page.width - 300, 1)
      .fill('#E8F5E9');
    doc.moveDown(0.3);
    
    // Información del reporte en caja
    const infoY = doc.y;
    const infoHeight = 40;
    
    // Caja de información con fondo sutil
    doc
      .rect(50, infoY, doc.page.width - 100, infoHeight)
      .fill('#FAFAFA')
      .strokeColor('#E0E0E0')
      .lineWidth(1)
      .rect(50, infoY, doc.page.width - 100, infoHeight)
      .stroke();
    
    doc.y = infoY + 10;
    
    // Información del cultivo
    doc
      .fontSize(12)
      .fillColor('#666666')
      .font('Helvetica')
      .text(`Fecha Generación: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
    
    doc.y = infoY + infoHeight + 10;
    
    // Línea decorativa inferior del encabezado
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private async agregarLogo(doc: PDFKit.PDFDocument) {
    try {
      // Buscar logo en formato PNG o JPG
      const logoPaths = [
        '/usr/src/app/assets/loguito.png',
        '/usr/src/app/assets/loguito.jpg',
        '/usr/src/app/dist/assets/loguito.png',
        '/usr/src/app/dist/assets/loguito.jpg',
        '/usr/src/app/src/assets/loguito.png',
        '/usr/src/app/src/assets/loguito.jpg'
      ];

      for (const logoPath of logoPaths) {
        try {
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 50, { width: 80 });
            console.log(`Logo loaded from: ${logoPath}`);
            return;
          }
        } catch (pathError) {
          console.log(`Failed to load logo from: ${logoPath}`, pathError);
          continue;
        }
      }

      console.log('Logo PNG/JPG no encontrado. Usando texto como respaldo.');
      
      // Texto de respaldo si no hay logo
      doc
        .fontSize(24)
        .fillColor('#2E7D32')
        .text('AGROTIC', 50, 50, { align: 'left' })
        .fontSize(12)
        .fillColor('#666666')
        .text('Sistema de Gestión Agrícola', 50, 80, { align: 'left' });
    } catch (error) {
      console.error('Error al agregar logo:', error);
      // Texto de respaldo
      doc.fontSize(20).fillColor('#2E7D32').text('AGROTIC', 50, 50);
    }
  }

  private dibujarLineaDecorativaMejorada(doc: PDFKit.PDFDocument) {
    // Línea superior gruesa
    doc
      .strokeColor('#2E7D32')
      .lineWidth(3)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    
    // Línea delgada decorativa
    doc
      .strokeColor('#81C784')
      .lineWidth(1)
      .moveTo(50, doc.y + 3)
      .lineTo(550, doc.y + 3)
      .stroke();
    
    doc.moveDown();
  }

  private generarResumen(doc: PDFKit.PDFDocument, reporte: ReporteCultivo) {
    doc
      .fontSize(14)
      .text('Resumen Ejecutivo', { underline: true })
      .moveDown(0.5);
    doc
      .fontSize(10)
      .text(`Este reporte cubre el período desde ${moment(reporte.periodo.inicio).format('DD/MM/YYYY')} hasta ${moment(reporte.periodo.fin).format('DD/MM/YYYY')}.`)
      .text(`Cultivo: ${reporte.cultivo.nombre_cultivo}`)
      .text(`Lote: ${reporte.cultivo.lote?.nombre_lote || 'No especificado'}`)
      .moveDown();
    if (reporte.analisis) {
      doc
        .text('Métricas Clave:', { underline: true })
        .text(`• Salud del cultivo: ${reporte.analisis.salud.toFixed(1)}/100`)
        .text(`• Rendimiento: ${reporte.analisis.rendimiento.toFixed(1)}/100`);
      
      if (reporte.finanzas) {
        doc.text(`• ROI: ${reporte.finanzas.resumen.roi.toFixed(2)}%`);
      }
      
      doc.moveDown();
    }
    if (reporte.analisis?.recomendaciones && reporte.analisis.recomendaciones.length > 0) {
      doc
        .text('Recomendaciones Principales:', { underline: true });
      
      reporte.analisis.recomendaciones.slice(0, 3).forEach(rec => {
        doc.text(`• ${rec}`);
      });
      
      doc.moveDown();
    }
    
    this.dibujarLinea(doc);
  }

  private generarMetricas(doc: PDFKit.PDFDocument, reporte: ReporteCultivo) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Métricas de Sensores', { underline: true })
      .moveDown(0.5);
    
    Object.entries(reporte.metricas).forEach(([metrica, datos], index) => {
      if (index > 0 && index % 2 === 0) {
        doc.addPage();
      }
      
      doc
        .fontSize(14)
        .fillColor('#333333')
        .text(metrica.charAt(0).toUpperCase() + metrica.slice(1), { underline: true })
        .moveDown(0.3);

      // Tabla de datos
      this.agregarTablaMetrica(doc, metrica, datos);
      
      doc.moveDown();
    });
    
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarGraficoMetrica(doc: PDFKit.PDFDocument, nombre: string, datos: any) {
    try {
      doc.fontSize(14).fillColor('#2E7D32').text(`Gráfico: ${nombre}`, { align: 'center' });
      doc.moveDown(0.5);
      
      if (!datos.datos || datos.datos.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No hay datos disponibles para mostrar');
        doc.moveDown();
        return;
      }
      
      const datosGrafico = datos.datos.slice(0, 8);
      const valores = datosGrafico.map(d => parseFloat(d.valor || 0));
      const maxValor = Math.max(...valores);
      const minValor = Math.min(...valores);
      const startX = 80;
      const startY = doc.y;
      const plotWidth = 400;
      const plotHeight = 120;
      const rango = maxValor - minValor;
      const getY = (v: number) => {
        if (rango <= 0) return startY + plotHeight / 2;
        const norm = (v - minValor) / rango;
        return startY + plotHeight - norm * plotHeight;
      };
      const puntos = datosGrafico.map((dato, index) => {
        const x = startX + 10 + index * (plotWidth / Math.max(1, datosGrafico.length - 1));
        const y = getY(parseFloat(dato.valor || 0));
        return { x, y, fecha: new Date(dato.fecha), valor: parseFloat(dato.valor || 0) };
      });
      doc.fillColor('#f8f9fa').rect(startX - 20, startY - 20, 500, plotHeight + 60).fill();
      doc.strokeColor('#dee2e6').lineWidth(1).rect(startX - 20, startY - 20, 500, plotHeight + 60).stroke();
      doc.strokeColor('#495057').lineWidth(2);
      doc.moveTo(startX, startY).lineTo(startX, startY + plotHeight + 20).stroke();
      doc.moveTo(startX, startY + plotHeight + 20).lineTo(startX + plotWidth, startY + plotHeight + 20).stroke();
      doc.strokeColor('#e9ecef').lineWidth(1);
      for (let i = 1; i <= 4; i++) {
        const yGrid = startY + (i * plotHeight) / 4;
        doc.moveTo(startX, yGrid).lineTo(startX + plotWidth, yGrid).stroke();
      }
      if (puntos.length > 0) {
        doc.strokeColor('#2196F3').lineWidth(2);
        doc.moveTo(puntos[0].x, puntos[0].y);
        for (let i = 1; i < puntos.length; i++) {
          doc.lineTo(puntos[i].x, puntos[i].y);
        }
        doc.stroke();
        puntos.forEach(p => {
          doc.fillColor('#2196F3').circle(p.x, p.y, 2).fill();
        });
        puntos.forEach((p, index) => {
          const fechaStr = `${p.fecha.getDate()}/${p.fecha.getMonth() + 1}`;
          doc.fontSize(8).fillColor('#666').text(fechaStr, p.x - 15, startY + plotHeight + 25);
          doc.fontSize(9).fillColor('#333').text(p.valor.toFixed(1), p.x - 10, p.y - 15);
        });
      }
      doc.fontSize(14).fillColor('#2E7D32').text(`Evolución de ${nombre}`, startX + 150, startY - 10);
      doc.moveDown(3);
      
      // Tabla de datos
      doc.fontSize(12).fillColor('#2E7D32').text('Datos Detallados:', { align: 'left' });
      doc.moveDown(0.3);
      
      const table = {
        headers: ['Fecha', 'Valor', 'Unidad', 'Ubicación'],
        rows: datosGrafico.map(d => [
          moment(d.fecha).format('DD/MM/YY HH:mm'),
          d.valor.toString(),
          d.unidad || '-',
          d.ubicacion || d.ubicacion_cultivo || d.ubicacion_sensor || '-'
        ])
      };
      
      this.dibujarTablaMejorada(doc, table);
      doc.moveDown();
      
    } catch (error) {
      console.error(`Error generando gráfico SVG para ${nombre}:`, error);
      doc.text(`Error al generar gráfico para ${nombre}`);
      doc.moveDown();
    }
  }

  private agregarTablaMetrica(doc: PDFKit.PDFDocument, nombre: string, datos: any) {
    doc.fontSize(12).fillColor('#333333').text('Historial de Lecturas:', { underline: true }).moveDown(0.3);
    
    const table = {
      headers: ['Fecha', 'Valor', 'Unidad', 'Sensor', 'Ubicación'],
      rows: datos.datos.slice(0, 15).map(d => [
        moment(d.fecha).format('DD/MM/YY HH:mm'),
        d.valor.toString(),
        d.unidad || '-',
        d.sensorNombre || 'N/A',
        d.subgrupoNombre || 'N/A'
      ])
    };
    
    this.dibujarTablaMejorada(doc, table);
    
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Resumen estadístico: ` +
            `Promedio: ${datos.resumen.promedio?.toFixed(2) || 0} | ` +
            `Máx: ${datos.resumen.maximo?.toFixed(2) || 0} | ` +
            `Mín: ${datos.resumen.minimo?.toFixed(2) || 0} | ` +
            `Registros: ${datos.resumen.totalRegistros || 0}`)
      .moveDown(0.5);
  }

  private generarActividades(doc: PDFKit.PDFDocument, actividades: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Historial de Actividades', { underline: true })
      .moveDown(0.5);
    
    // Verificar si hay actividades en la lista o si es un objeto con propiedad lista
    const actividadesLista = actividades?.lista || actividades || [];
    
    if (!actividadesLista || !Array.isArray(actividadesLista) || actividadesLista.length === 0) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay actividades registradas para este cultivo en el período seleccionado.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    
    // Tabla de actividades
    const table = {
      headers: ['Fecha', 'Actividad', 'Descripción', 'Estado', 'Responsable'],
      rows: actividadesLista.slice(0, 20).map(act => [
        moment(act.fecha).format('DD/MM/YYYY'),
        act.tipo || 'N/A',
        act.descripcion || '-',
        act.estado || 'N/A',
        act.responsable || 'N/A'
      ])
    };
    
    this.dibujarTablaMejorada(doc, table);
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarFinanzas(doc: PDFKit.PDFDocument, finanzas: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Control Financiero', { underline: true })
      .moveDown(0.5);
    
    if (!finanzas || (!finanzas.costos?.length && !finanzas.ingresos?.length)) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay datos financieros registrados para este cultivo en el período seleccionado.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    if (finanzas.resumen) {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text('Resumen Financiero:', { underline: true })
        .moveDown(0.3);
      
      const resumenTable = {
        headers: ['Indicador', 'Valor', 'Formato'],
        rows: [
          ['Ingresos Totales', `$${(finanzas.resumen.ingresosTotales || 0).toFixed(2)}`, '$'],
          ['Costos Totales', `$${(finanzas.resumen.costosTotales || 0).toFixed(2)}`, '$'],
          ['Margen Bruto', `$${(finanzas.resumen.margenBruto || 0).toFixed(2)}`, '$'],
          ['ROI', `${(finanzas.resumen.roi || 0).toFixed(2)}%`, '%']
        ]
      };
      
      this.dibujarTablaMejorada(doc, resumenTable);
      doc.moveDown(0.5);
    }
    
    if (finanzas.ingresos && finanzas.ingresos.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text('Ingresos:', { underline: true })
        .moveDown(0.3);
      
      const ingresosTable = {
        headers: ['Fecha', 'Concepto', 'Monto', 'Tipo'],
        rows: finanzas.ingresos.slice(0, 10).map(ing => [
          moment(ing.fecha).format('DD/MM/YYYY'),
          ing.concepto || 'N/A',
          `$${(ing.monto || 0).toFixed(2)}`,
          'Ingreso'
        ])
      };
      
      this.dibujarTablaIzquierda(doc, ingresosTable);
      doc.moveDown(0.5);
    }
    
    if (finanzas.costos && finanzas.costos.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text('Costos:', { underline: true })
        .moveDown(0.3);
      
      // Separar costos por actividades de otros costos
      const costosActividades = finanzas.costos.filter(cos => cos.tipo === 'costo_actividad');
      const otrosCostos = finanzas.costos.filter(cos => cos.tipo !== 'costo_actividad');
      
      // Mostrar costos por actividades con detalles
      if (costosActividades.length > 0) {
        doc
          .fontSize(11)
          .fillColor('#333333')
          .text('Costos por Actividad (Mano de Obra y Maquinaria):', { underline: true })
          .moveDown(0.3);
        
        const costosActividadesTable = {
          headers: ['Fecha', 'Actividad', 'Responsable', 'Mano de Obra', 'Maquinaria', 'Total', 'Horas'],
          rows: costosActividades.slice(0, 15).map(cos => {
            const detalles = cos.detalles || {};
            return [
              moment(cos.fecha).format('DD/MM/YYYY'),
              detalles.actividad || cos.descripcion || 'N/A',
              detalles.responsable || 'N/A',
              `$${(detalles.costoManoObra || 0).toFixed(2)}`,
              `$${(detalles.costoMaquinaria || 0).toFixed(2)}`,
              `$${(cos.monto || 0).toFixed(2)}`,
              detalles.horasTrabajadas ? `${detalles.horasTrabajadas}h` : 'N/A'
            ];
          })
        };
        
        this.dibujarTablaIzquierda(doc, costosActividadesTable);
        doc.moveDown(0.5);
      }
      
      // Mostrar otros costos
      if (otrosCostos.length > 0) {
        doc
          .fontSize(11)
          .fillColor('#333333')
          .text('Otros Costos:', { underline: true })
          .moveDown(0.3);
        
        const otrosCostosTable = {
          headers: ['Fecha', 'Descripción', 'Monto', 'Tipo'],
          rows: otrosCostos.slice(0, 10).map(cos => [
            moment(cos.fecha).format('DD/MM/YYYY'),
            cos.descripcion || 'N/A',
            `$${(cos.monto || 0).toFixed(2)}`,
            cos.tipo || 'Costo'
          ])
        };
        
        this.dibujarTablaIzquierda(doc, otrosCostosTable);
        doc.moveDown(0.5);
      }
    }
    
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarInventario(doc: PDFKit.PDFDocument, inventario: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Inventario de Insumos', { underline: true })
      .moveDown(0.5);
    
    if (!inventario || !inventario.insumos || !inventario.insumos.length) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay datos de inventario registrados para este cultivo.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    
    const table = {
      headers: ['Producto', 'Stock Actual', 'Unidad', 'Estado', 'Último Movimiento'],
      rows: inventario.insumos.slice(0, 20).map(item => [
        item.nombre || 'N/A',
        item.cantidad?.toString() || '0',
        item.unidad || 'N/A',
        'Activo',
        item.fecha ? moment(item.fecha).format('DD/MM/YYYY') : 'N/A'
      ])
    };
    
    this.dibujarTablaMejorada(doc, table);
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarAlertas(doc: PDFKit.PDFDocument, alertas: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Alertas del Sistema', { underline: true })
      .moveDown(0.5);
    
    if (!alertas || !alertas.lista || !alertas.lista.length) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay alertas registradas para este cultivo en el período seleccionado.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    
    const alertasCriticas = alertas.lista.filter(a => a.tipo === 'CRITICA');
    const alertasInformativas = alertas.lista.filter(a => a.tipo === 'INFORMATIVA');
    
    if (alertasCriticas.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#D32F2F')
        .text('Alertas Críticas:', { underline: true })
        .moveDown(0.3);
      
      alertasCriticas.forEach(alerta => {
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`• ${moment(alerta.fecha).format('DD/MM/YYYY HH:mm')} - ${alerta.mensaje}`)
          .moveDown(0.2);
      });
      
      doc.moveDown(0.5);
    }
    
    if (alertasInformativas.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#1976D2')
        .text('Alertas Informativas:', { underline: true })
        .moveDown(0.3);
      
      alertasInformativas.forEach(alerta => {
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`• ${moment(alerta.fecha).format('DD/MM/YYYY HH:mm')} - ${alerta.mensaje}`)
          .moveDown(0.2);
      });
    }
    
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarTrazabilidad(doc: PDFKit.PDFDocument, trazabilidad: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Trazabilidad del Cultivo', { underline: true })
      .moveDown(0.5);
    
    if (!trazabilidad || !trazabilidad.cultivo) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay datos de trazabilidad disponibles para este cultivo.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    
    const cultivo = trazabilidad.cultivo;
    
    // Información general del cultivo
    doc
      .fontSize(12)
      .fillColor('#333333')
      .text('Información General:', { underline: true })
      .moveDown(0.3);
    
    const infoTable = {
      headers: ['Propiedad', 'Valor'],
      rows: [
        ['ID Cultivo', cultivo.id || 'N/A'],
        ['Nombre', cultivo.nombre || 'N/A'],
        ['Tipo', cultivo.tipo || 'N/A'],
        ['Estado', cultivo.estado || 'N/A'],
        ['Lote', cultivo.lote || 'N/A'],
        ['Fecha Siembra', cultivo.fechaSiembra ? moment(cultivo.fechaSiembra).format('DD/MM/YYYY') : 'N/A'],
        ['Fecha Cosecha Estimada', cultivo.fechaCosechaEstimada ? moment(cultivo.fechaCosechaEstimada).format('DD/MM/YYYY') : 'N/A'],
        ['Fecha Creación', cultivo.fechaCreacion ? moment(cultivo.fechaCreacion).format('DD/MM/YYYY') : 'N/A']
      ]
    };
    
    this.dibujarTablaMejorada(doc, infoTable);
    doc.moveDown(0.5);
    
    // Observaciones
    if (cultivo.observaciones && cultivo.observaciones !== 'Sin observaciones') {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text('Observaciones:', { underline: true })
        .moveDown(0.3);
      
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(cultivo.observaciones)
        .moveDown(0.5);
    }
    
    // Línea de tiempo de actividades
    if (cultivo.actividades && cultivo.actividades.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text('Línea de Tiempo de Actividades:', { underline: true })
        .moveDown(0.3);
      
      const actividadesTable = {
        headers: ['Fecha', 'Tipo', 'Descripción', 'Estado'],
        rows: cultivo.actividades.map(act => [
          act.fecha ? moment(act.fecha).format('DD/MM/YYYY') : 'N/A',
          act.tipo || 'N/A',
          act.descripcion || '-',
          act.estado || 'N/A'
        ])
      };
      
      this.dibujarTablaMejorada(doc, actividadesTable);
    }
    
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarAnalisis(doc: PDFKit.PDFDocument, analisis: any) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#2E7D32')
      .text('Análisis y Recomendaciones', { underline: true })
      .moveDown(0.5);
    
    if (!analisis) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('No hay suficientes datos para generar análisis y recomendaciones.')
        .moveDown();
      this.dibujarLineaDecorativaMejorada(doc);
      return;
    }
    
    doc
      .fontSize(12)
      .fillColor('#333333')
      .text('Métricas de Rendimiento:', { underline: true })
      .moveDown(0.3);
    
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Salud del Cultivo: ${analisis.salud?.toFixed(1) || '0.0'}/100`)
      .text(`Rendimiento: ${analisis.rendimiento?.toFixed(1) || '0.0'}/100`)
      .text(`Eficiencia: ${analisis.eficiencia?.toFixed(1) || '0.0'}/100`)
      .moveDown(0.5);
    
    if (analisis.recomendaciones && analisis.recomendaciones.length > 0) {
      doc
        .fontSize(12)
        .text('Recomendaciones:', { underline: true })
        .moveDown(0.3);
      
      analisis.recomendaciones.slice(0, 10).forEach((rec, index) => {
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`${index + 1}. ${rec}`)
          .moveDown(0.2);
      });
    }
    
    this.dibujarLineaDecorativaMejorada(doc);
  }

  private generarPiePagina(doc: PDFKit.PDFDocument) {
    const fecha = new Date().toLocaleDateString();
    const pagina = doc.bufferedPageRange().count;
    
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text(`Página ${pagina}`, { align: 'right' })
      .text(`Generado el ${fecha} por AGROTIC - Sistema de Gestión Agrícola`, 
            { align: 'center' });
  }

  private dibujarTablaIzquierda(doc: PDFKit.PDFDocument, table: { headers: string[], rows: string[][] }) {
    const startY = doc.y;
    const startX = 50;
    const cellPadding = 4;
    const rowHeight = 20;
    const colWidths = this.calcularAnchoColumnas(table.headers.length);
    
    doc.fillColor('#2E7D32');
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
    
    doc.fillColor('#FFFFFF');
    doc.fontSize(10);
    let x = startX;
    table.headers.forEach((header, i) => {
      doc.text(header, x + 4, startY + 4, { 
        width: colWidths[i] - 8, 
        align: 'left'
      });
      x += colWidths[i];
    });
    
    doc.fillColor('#333333');
    doc.fontSize(9);
    table.rows.forEach((row, rowIndex) => {
      x = startX;
      const y = startY + rowHeight + (rowIndex * rowHeight);
      
      // Fila par/impar
      if (rowIndex % 2 === 0) {
        doc.fillColor('#F5F5F5');
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
      }
      
      doc.fillColor('#333333');
      row.forEach((cell, cellIndex) => {
        doc.text(cell, x + 4, y + 4, { 
          width: colWidths[cellIndex] - 8, 
          align: 'left'
        });
        x += colWidths[cellIndex];
      });
    });
  }

  private dibujarTablaMejorada(doc: PDFKit.PDFDocument, table: { headers: string[], rows: string[][] }) {
    const startY = doc.y;
    const startX = 50;
    const cellPadding = 4;
    const rowHeight = 20;
    const colWidths = this.calcularAnchoColumnas(table.headers.length);
    
    doc.fillColor('#2E7D32');
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
    
    doc.fillColor('#FFFFFF');
    doc.fontSize(10);
    let x = startX;
    table.headers.forEach((header, i) => {
      doc.text(header, x + 4, startY + 4, { 
        width: colWidths[i] - 8, 
        align: 'left'
      });
      x += colWidths[i];
    });
    
    doc.fillColor('#333333');
    doc.fontSize(9);
    table.rows.forEach((row, rowIndex) => {
      x = startX;
      const yPos = startY + (rowIndex + 1) * rowHeight;
      
      if (rowIndex % 2 === 0) {
        doc.fillColor('#F5F5F5');
        doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
        doc.fillColor('#333333');
      }
      
      row.forEach((cell, colIndex) => {
        doc.rect(x, yPos, colWidths[colIndex], rowHeight).stroke();
        doc.text(cell, x + 4, yPos + 4, { 
          width: colWidths[colIndex] - 8, 
          align: 'left'
        });
        x += colWidths[colIndex];
      });
    });
    
    doc.moveDown(1);
  }

  private calcularAnchoColumnas(numCols: number): number[] {
    const totalWidth = 500;
    const minWidth = 80;
    
    if (numCols === 2) return [150, totalWidth - 150];
    if (numCols === 3) return [120, 150, totalWidth - 270];
    if (numCols === 4) return [100, 120, 130, totalWidth - 350];
    if (numCols === 5) return [80, 100, 110, 120, totalWidth - 410];
    
    const width = totalWidth / numCols;
    return Array(numCols).fill(width);
  }

  private dibujarLinea(doc: PDFKit.PDFDocument) {
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown();
  }

  private dibujarTabla(doc: PDFKit.PDFDocument, table: { headers: string[], rows: string[][] }) {
    const startY = doc.y;
    const startX = 50;
    const cellPadding = 10;
    const rowHeight = 20;
    const colWidths = [100, 80, 60, 100];
    
    let x = startX;
    table.headers.forEach((header, i) => {
      doc.rect(x, startY, colWidths[i], rowHeight).stroke();
      doc.text(header, x + 5, startY + 5, { width: colWidths[i] - 10, align: 'left' });
      x += colWidths[i];
    });
    
    table.rows.forEach((row, rowIndex) => {
      x = startX;
      row.forEach((cell, colIndex) => {
        doc.rect(x, startY + (rowIndex + 1) * rowHeight, colWidths[colIndex], rowHeight).stroke();
        doc.text(cell, x + 5, startY + (rowIndex + 1) * rowHeight + 5, { 
          width: colWidths[colIndex] - 10, 
          align: 'left' 
        });
        x += colWidths[colIndex];
      });
    });
    
    doc.moveDown(2);
  }

  // Métodos para Excel
  private agregarHojaResumen(sheet: ExcelJS.Worksheet, reporte: ReporteCultivo) {
    sheet.addRow(['Reporte de Cultivo - Resumen']);
    sheet.addRow([]);
    sheet.addRow(['Cultivo', reporte.cultivo.nombre_cultivo]);
    sheet.addRow(['Lote', reporte.cultivo.lote?.nombre_lote || 'No especificado']);
    sheet.addRow(['Período', `${moment(reporte.periodo.inicio).format('DD/MM/YYYY')} - ${moment(reporte.periodo.fin).format('DD/MM/YYYY')}`]);
    sheet.addRow(['Fecha Generación', moment().format('DD/MM/YYYY HH:mm')]);
  }

  private agregarHojaMetricas(sheet: ExcelJS.Worksheet, metricas: any) {
    sheet.addRow(['Métricas de Sensores - Lecturas Históricas']);
    sheet.addRow([]);
    
    if (!metricas || Object.keys(metricas).length === 0) {
      sheet.addRow(['No hay datos de sensores disponibles']);
      return;
    }

    Object.entries(metricas).forEach(([nombre, datos]: [string, any]) => {
      sheet.addRow([`Métrica: ${nombre.toUpperCase()}`]);
      sheet.addRow([]);
      sheet.addRow(['Fecha', 'Valor', 'Unidad', 'Sensor ID', 'Sensor', 'Ubicación', 'Promedio', 'Máximo', 'Mínimo']);
      
      if (datos.datos && datos.datos.length > 0) {
        datos.datos.forEach((lectura: any) => {
          sheet.addRow([
            moment(lectura.fecha).format('DD/MM/YYYY HH:mm'),
            lectura.valor,
            lectura.unidad || 'N/A',
            lectura.sensorId || 'N/A',
            lectura.sensorNombre || 'N/A',
            lectura.subgrupoNombre || 'N/A',
            datos.resumen.promedio?.toFixed(2) || 0,
            datos.resumen.maximo?.toFixed(2) || 0,
            datos.resumen.minimo?.toFixed(2) || 0
          ]);
        });
        
        // Resumen estadístico
        sheet.addRow([]);
        sheet.addRow(['RESUMEN ESTADÍSTICO']);
        sheet.addRow(['Total de Registros', datos.resumen.totalRegistros || 0]);
        sheet.addRow(['Valor Promedio', datos.resumen.promedio?.toFixed(2) || 0]);
        sheet.addRow(['Valor Máximo', datos.resumen.maximo?.toFixed(2) || 0]);
        sheet.addRow(['Valor Mínimo', datos.resumen.minimo?.toFixed(2) || 0]);
        sheet.addRow(['Desviación Estándar', datos.resumen.desviacionEstandar?.toFixed(2) || 0]);
      } else {
        sheet.addRow(['No hay datos para esta métrica']);
      }
      
      sheet.addRow([]); // Separador entre métricas
      sheet.addRow(['='.repeat(50)]);
      sheet.addRow([]);
    });
  }

  private agregarHojaActividades(sheet: ExcelJS.Worksheet, actividades: any) {
    sheet.addRow(['Historial de Actividades']);
    sheet.addRow([]);
    sheet.addRow(['Fecha', 'Tipo', 'Descripción', 'Estado', 'Responsable']);
    
    const actividadesLista = actividades?.lista || actividades || [];
    
    if (!actividadesLista || !Array.isArray(actividadesLista) || actividadesLista.length === 0) {
      sheet.addRow(['No hay actividades registradas']);
      return;
    }
    
    actividadesLista.forEach((actividad: any) => {
      sheet.addRow([
        moment(actividad.fecha).format('DD/MM/YYYY'),
        actividad.tipo || 'N/A',
        actividad.descripcion || '-',
        actividad.estado || 'N/A',
        actividad.responsable || 'N/A'
      ]);
    });
  }

  private agregarHojaFinanzas(sheet: ExcelJS.Worksheet, finanzas: any) {
    sheet.addRow(['Control Financiero']);
    sheet.addRow([]);
    
    if (finanzas.resumen) {
      sheet.addRow(['Resumen Financiero']);
      sheet.addRow([]);
      
      const resumenHeaders = ['Indicador', 'Valor', 'Formato'];
      sheet.addRow(resumenHeaders);
      
      const resumenData = [
        ['Costos Totales', finanzas.resumen.costosTotales || 0, '$'],
        ['Ingresos Totales', finanzas.resumen.ingresosTotales || 0, '$'],
        ['Margen Bruto', finanzas.resumen.margenBruto || 0, '$'],
        ['ROI', finanzas.resumen.roi || 0, '%']
      ];
      
      resumenData.forEach(row => {
        sheet.addRow(row);
      });
      
      sheet.addRow([]); 
    }
    
    // Tabla de ingresos
    if (finanzas.ingresos && finanzas.ingresos.length > 0) {
      sheet.addRow(['Ingresos']);
      sheet.addRow(['Fecha', 'Concepto', 'Monto', 'Tipo']);
      
      finanzas.ingresos.forEach((ingreso: any) => {
        sheet.addRow([
          moment(ingreso.fecha).format('DD/MM/YYYY'),
          ingreso.concepto || 'N/A',
          ingreso.monto || 0,
          'Ingreso'
        ]);
      });
      
      sheet.addRow([]);
    }
    
    // Tabla de costos
    if (finanzas.costos && finanzas.costos.length > 0) {
      // Separar costos por actividades de otros costos
      const costosActividades = finanzas.costos.filter(cos => cos.tipo === 'costo_actividad');
      const otrosCostos = finanzas.costos.filter(cos => cos.tipo !== 'costo_actividad');
      
      // Mostrar costos por actividades con detalles
      if (costosActividades.length > 0) {
        sheet.addRow(['Costos por Actividad (Mano de Obra y Maquinaria)']);
        sheet.addRow(['Fecha', 'Actividad', 'Responsable', 'Mano de Obra', 'Maquinaria', 'Total', 'Horas Trabajadas', 'Tarifa/Hora']);
        
        costosActividades.forEach((costo: any) => {
          const detalles = costo.detalles || {};
          sheet.addRow([
            moment(costo.fecha).format('DD/MM/YYYY'),
            detalles.actividad || costo.descripcion || 'N/A',
            detalles.responsable || 'N/A',
            detalles.costoManoObra || 0,
            detalles.costoMaquinaria || 0,
            costo.monto || 0,
            detalles.horasTrabajadas || 0,
            detalles.tarifaHora || 0
          ]);
        });
        
        sheet.addRow([]);
      }
      
      // Mostrar otros costos
      if (otrosCostos.length > 0) {
        sheet.addRow(['Otros Costos']);
        sheet.addRow(['Fecha', 'Descripción', 'Monto', 'Tipo']);
        
        otrosCostos.forEach((costo: any) => {
          sheet.addRow([
            moment(costo.fecha).format('DD/MM/YYYY'),
            costo.descripcion || 'N/A',
            costo.monto || 0,
            costo.tipo || 'Costo'
          ]);
        });
      }
    } else if (!finanzas.ingresos || finanzas.ingresos.length === 0) {
      sheet.addRow(['No hay datos financieros registrados']);
    }
  }

  private agregarHojaInventario(sheet: ExcelJS.Worksheet, inventario: any) {
    sheet.addRow(['Inventario de Insumos']);
    sheet.addRow([]);
    sheet.addRow(['Producto', 'Stock Actual', 'Unidad', 'Estado', 'Último Movimiento']);
    
    if (!inventario || !inventario.insumos || !inventario.insumos.length) {
      sheet.addRow(['No hay datos de inventario']);
      return;
    }
    
    inventario.insumos.forEach((item: any) => {
      sheet.addRow([
        item.nombre || 'N/A',
        item.cantidad || 0,
        item.unidad || 'N/A',
        item.estado || 'N/A',
        item.fecha ? moment(item.fecha).format('DD/MM/YYYY') : 'N/A'
      ]);
    });
  }

  private agregarHojaAlertas(sheet: ExcelJS.Worksheet, alertas: any) {
    sheet.addRow(['Alertas del Sistema']);
    sheet.addRow([]);
    sheet.addRow(['Fecha', 'Tipo', 'Mensaje', 'Prioridad']);
    
    if (!alertas || !alertas.lista || !alertas.lista.length) {
      sheet.addRow(['No hay alertas registradas']);
      return;
    }
    
    alertas.lista.forEach((alerta: any) => {
      sheet.addRow([
        moment(alerta.fecha).format('DD/MM/YYYY HH:mm'),
        alerta.tipo || 'N/A',
        alerta.mensaje || 'N/A',
        alerta.prioridad || 'N/A'
      ]);
    });
  }

  private agregarHojaTrazabilidad(sheet: ExcelJS.Worksheet, trazabilidad: any) {
    sheet.addRow(['Trazabilidad del Cultivo']);
    sheet.addRow([]);
    
    if (!trazabilidad || !trazabilidad.cultivo) {
      sheet.addRow(['No hay datos de trazabilidad disponibles']);
      return;
    }
    
    const cultivo = trazabilidad.cultivo;
    
    // Información general
    sheet.addRow(['Información General']);
    sheet.addRow(['Propiedad', 'Valor']);
    
    const infoData = [
      ['ID Cultivo', cultivo.id || 'N/A'],
      ['Nombre', cultivo.nombre || 'N/A'],
      ['Tipo', cultivo.tipo || 'N/A'],
      ['Estado', cultivo.estado || 'N/A'],
      ['Lote', cultivo.lote || 'N/A'],
      ['Fecha Siembra', cultivo.fechaSiembra ? moment(cultivo.fechaSiembra).format('DD/MM/YYYY') : 'N/A'],
      ['Fecha Cosecha Estimada', cultivo.fechaCosechaEstimada ? moment(cultivo.fechaCosechaEstimada).format('DD/MM/YYYY') : 'N/A'],
      ['Fecha Creación', cultivo.fechaCreacion ? moment(cultivo.fechaCreacion).format('DD/MM/YYYY') : 'N/A']
    ];
    
    infoData.forEach(row => {
      sheet.addRow(row);
    });
    
    sheet.addRow([]); // Separador
    
    // Observaciones
    if (cultivo.observaciones && cultivo.observaciones !== 'Sin observaciones') {
      sheet.addRow(['Observaciones']);
      sheet.addRow([cultivo.observaciones]);
      sheet.addRow([]); // Separador
    }
    
    // Línea de tiempo de actividades
    if (cultivo.actividades && cultivo.actividades.length > 0) {
      sheet.addRow(['Línea de Tiempo de Actividades']);
      sheet.addRow(['Fecha', 'Tipo', 'Descripción', 'Estado']);
      
      cultivo.actividades.forEach(act => {
        sheet.addRow([
          act.fecha ? moment(act.fecha).format('DD/MM/YYYY') : 'N/A',
          act.tipo || 'N/A',
          act.descripcion || '-',
          act.estado || 'N/A'
        ]);
      });
    }
  }
}
