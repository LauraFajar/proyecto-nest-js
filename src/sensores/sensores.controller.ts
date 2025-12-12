import {
Controller,
Get,
Post,
Put,
Param,
ParseIntPipe,
Body,
Res,
HttpStatus,
Query,
} from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { Workbook } from 'exceljs';
import { ReportsService } from './services/reports.service';
import { MqttService } from './services/mqtt.service';

@Controller('sensores')
export class SensoresController {
constructor(
  private readonly sensoresService: SensoresService,
  private readonly reportsService: ReportsService,
  private readonly mqttService: MqttService,
) {}

@Get()
async findAll() {
return this.sensoresService.findAll();
}

@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
return this.sensoresService.findOne(id);
}

@Put(':id')
async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
return this.sensoresService.update(id, data);
}

@Get(':id/lecturas')
async obtenerLecturas(@Param('id', ParseIntPipe) id: number) {
const fn = (this.sensoresService as any).obtenerLecturasDeSensor;
if (typeof fn === 'function') {
  return fn.call(this.sensoresService, id);
}
return [];
}

@Get('export/pdf')
async generarPDF(
  @Query('topic') topic: string,
  @Query('metric') metric: string,
  @Res() res: Response,
  @Query('desde') desde?: string,
  @Query('hasta') hasta?: string,
) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }

  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(desde);
  const dHasta = parse(hasta);
  if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildPDFPorTopic(topic, metric, dDesde, dHasta);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${encodeURIComponent(topic)}.pdf`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el PDF', error: String(e) });
  }
}

@Get('export/excel')
async generarExcel(
  @Query('topic') topic: string,
  @Query('metric') metric: string,
  @Res() res: Response,
  @Query('desde') desde?: string,
  @Query('hasta') hasta?: string,
) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }

  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(desde);
  const dHasta = parse(hasta);
  if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    console.log('🚀 Iniciando generación Excel para topic:', topic, 'metric:', metric);
    const buffer = await this.reportsService.buildExcelPorTopic(topic, metric, dDesde, dHasta);
    console.log('✅ Excel generado exitosamente, tamaño:', buffer.byteLength, 'bytes');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${encodeURIComponent(topic)}.xlsx`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    console.error('❌ Error generando Excel:', e);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el Excel', error: String(e) });
  }
}

@Post('mqtt/init')
async inicializarMQTT() {
await this.sensoresService.inicializarConexionesMqtt();
return { message: 'MQTT inicializado correctamente.' };
}

@Get('reporte-iot/pdf')
async generarIoTCompletePDF(
  @Res() res: Response,
  @Query('fecha_desde') fecha_desde?: string,
  @Query('fecha_hasta') fecha_hasta?: string,
) {
  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(fecha_desde);
  const dHasta = parse(fecha_hasta);
  if (fecha_desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "fecha_desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (fecha_hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "fecha_hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildIoTCompletePDF(dDesde, dHasta);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-iot-completo.pdf`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el reporte IoT PDF', error: String(e) });
  }
}

@Get('reporte-iot/excel')
async generarIoTCompleteExcel(
  @Res() res: Response,
  @Query('fecha_desde') fecha_desde?: string,
  @Query('fecha_hasta') fecha_hasta?: string,
) {
  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(fecha_desde);
  const dHasta = parse(fecha_hasta);
  if (fecha_desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "fecha_desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (fecha_hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "fecha_hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildIoTCompleteExcel(dDesde, dHasta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-iot-completo.xlsx`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el reporte IoT Excel', error: String(e) });
  }
}

@Get('historial')
async getHistorialByTopic(
    @Query('topic') topic: string,
    @Query('metric') metric?: string,
    @Query('periodo') periodo?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    try {
      if (!topic) {
        return { error: 'El parámetro "topic" es obligatorio.' };
      }

      const parse = (s?: string) => (s ? new Date(s) : undefined);
      const dDesde = parse(fecha_desde);
      const dHasta = parse(fecha_hasta);
      
      const queryOptions = {
        metric,
        desde: dDesde,
        hasta: dHasta,
        order: order || 'ASC',
        limit: limit ? parseInt(limit, 10) : undefined
      };

      const lecturas = await this.reportsService.obtenerLecturasPorTopic(topic, queryOptions);
      
      return {
        topic,
        metric: metric || 'todas',
        periodo: periodo || 'general',
        total_lecturas: lecturas.length,
        fecha_desde: fecha_desde || null,
        fecha_hasta: fecha_hasta || null,
        lecturas: lecturas
      };
    } catch (e) {
      return { error: 'No se pudo obtener el historial', message: String(e) };
    }
  }

@Get('topics')
async listTopics() {
  try {
    const topics = await this.sensoresService.listTopics();
    return { topics };
  } catch (e) {
    return { error: 'Error al obtener topics', message: String(e) };
  }
}

@Post('subscribe')
async subscribeLegacy(@Body('topic') topic: string, @Res() res: Response) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }
  try {
    const fn = (this.mqttService as any).subscribeTopic;
    if (typeof fn === 'function') {
      fn.call(this.mqttService, topic);
      return res.status(HttpStatus.OK).json({ message: `Suscrito al topic ${topic}` });
    }
    return res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'La función subscribeTopic no está disponible.' });
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo suscribir al topic', error: String(e) });
  }
}

@Get('iot/info')
async obtenerInfoIoT() {
  try {
    const sensores = await this.reportsService.obtenerSensoresConUbicaciones();
    const bombaData = await this.reportsService.contarActivacionesBombaPorPeriodo();
     
    return {
      sensores: sensores,
      resumen_bomba: bombaData,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { message: 'No se pudo obtener la información IoT', error: String(e) };
  }
}

@Post('unsubscribe')
async unsubscribeLegacy(@Body('topic') topic: string, @Res() res: Response) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }
  try {
    const fn = (this.mqttService as any).unsubscribeTopic;
    if (typeof fn === 'function') {
      fn.call(this.mqttService, topic);
      return res.status(HttpStatus.OK).json({ message: `Desuscrito del topic ${topic}` });
    }
    return res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'La función unsubscribeTopic no está disponible.' });
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo desuscribir del topic', error: String(e) });
  }
}

@Get('export/general/excel')
async generarExcelGeneralPorTopic(
  @Query('topic') topic: string,
  @Res() res: Response,
  @Query('desde') desde?: string,
  @Query('hasta') hasta?: string,
) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }

  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(desde);
  const dHasta = parse(hasta);
  if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildExcelGeneralPorTopic(topic, dDesde, dHasta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_general_${encodeURIComponent(topic)}.xlsx`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el Excel general', error: String(e) });
  }
}

@Get('export/metric/excel')
async generarExcelPorMetrica(
  @Query('topic') topic: string,
  @Query('metric') metric: string,
  @Res() res: Response,
  @Query('desde') desde?: string,
  @Query('hasta') hasta?: string,
) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }
  if (!metric) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "metric" es obligatorio.' });
  }

  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(desde);
  const dHasta = parse(hasta);
  if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildExcelPorTopic(topic, metric, dDesde, dHasta);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${encodeURIComponent(metric)}_${encodeURIComponent(topic)}.xlsx`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el Excel por métrica', error: String(e) });
  }
}

@Get('export/metric/pdf')
async generarPDFPorMetrica(
  @Query('topic') topic: string,
  @Query('metric') metric: string,
  @Res() res: Response,
  @Query('desde') desde?: string,
  @Query('hasta') hasta?: string,
) {
  if (!topic) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "topic" es obligatorio.' });
  }
  if (!metric) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El parámetro "metric" es obligatorio.' });
  }

  const parse = (s?: string) => (s ? new Date(s) : undefined);
  const dDesde = parse(desde);
  const dHasta = parse(hasta);
  if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }
  if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).' });
  }

  try {
    const buffer = await this.reportsService.buildPDFPorTopic(topic, metric, dDesde, dHasta);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${encodeURIComponent(metric)}_${encodeURIComponent(topic)}.pdf`);
    return res.status(HttpStatus.OK).send(buffer);
  } catch (e) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'No se pudo generar el PDF por métrica', error: String(e) });
  }
}
}