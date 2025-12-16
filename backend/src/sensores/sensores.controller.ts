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
  BadRequestException,
  InternalServerErrorException,
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

  @Post('config-mqtt')
  async configMqtt(@Body() config: { brokerUrl: string; port: string | number; topic?: string }) {
    if (!config.brokerUrl || !config.port) {
      throw new BadRequestException('Broker URL and port are required');
    }

    let url = config.brokerUrl;
    let protocol = 'mqtt';
    
    if (url.includes('://')) {
        const parts = url.split('://');
        protocol = parts[0];
        url = parts[1];
    } else {
        // Default to mqtt if no protocol provided, though frontend validation enforces it usually.
    }
    
    // Remove port from host if exists in the url part
    let host = url;
    if (host.includes(':')) {
        host = host.split(':')[0];
    }
    
    const fullUrl = `${protocol}://${host}:${config.port}`;
    
    console.log(`Reconfiguring MQTT to: ${fullUrl}`);
    await this.mqttService.reconnect(fullUrl);
    
    return { message: 'MQTT Reconfigured', url: fullUrl };
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }

    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(desde);
    const dHasta = parse(hasta);
    if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildPDFPorTopic(
        topic,
        metric,
        dDesde,
        dHasta,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_${encodeURIComponent(topic)}.pdf`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'No se pudo generar el PDF', error: String(e) });
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }

    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(desde);
    const dHasta = parse(hasta);
    if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      console.log(
        '🚀 Iniciando generación Excel para topic:',
        topic,
        'metric:',
        metric,
      );
      const buffer = await this.reportsService.buildExcelPorTopic(
        topic,
        metric,
        dDesde,
        dHasta,
      );
      console.log(
        '✅ Excel generado exitosamente, tamaño:',
        buffer.byteLength,
        'bytes',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_${encodeURIComponent(topic)}.xlsx`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      console.error('❌ Error generando Excel:', e);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'No se pudo generar el Excel', error: String(e) });
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
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "fecha_desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (fecha_hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "fecha_hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildIoTCompletePDF(
        dDesde,
        dHasta,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte-iot-completo.pdf`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el reporte IoT PDF',
        error: String(e),
      });
    }
  }

  @Get('reporte-iot/data')
  async getReporteIoTData(
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(fecha_desde);
    const dHasta = parse(fecha_hasta);

    if (fecha_desde && (!dDesde || isNaN(dDesde.getTime()))) {
      throw new BadRequestException(
        'Formato de fecha "fecha_desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      );
    }
    if (fecha_hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      throw new BadRequestException(
        'Formato de fecha "fecha_hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      );
    }

    try {
      const lecturas = await this.reportsService.obtenerLecturasIoTCompletas(
        dDesde,
        dHasta,
      );
      const sensores =
        await this.reportsService.obtenerSensoresConUbicaciones();
      const bombaData =
        await this.reportsService.contarActivacionesBombaPorPeriodo(
          dDesde,
          dHasta,
        );

      return {
        lecturas,
        sensores,
        bombaData,
        timestamp: new Date().toISOString(),
        params: {
          desde: dDesde?.toISOString() || null,
          hasta: dHasta?.toISOString() || null,
        },
      };
    } catch (error) {
      console.error('Failed to get IoT report data:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener la data para el reporte IoT.',
      );
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
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "fecha_desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (fecha_hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "fecha_hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildExcelIoTCompletas(
        dDesde,
        dHasta,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte-iot-completo.xlsx`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el reporte IoT Excel',
        error: String(e),
      });
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
        limit: limit ? parseInt(limit, 10) : undefined,
      };

      const lecturas = await this.reportsService.obtenerLecturasPorTopic(
        topic,
        queryOptions,
      );

      return {
        topic,
        metric: metric || 'todas',
        periodo: periodo || 'general',
        total_lecturas: lecturas.length,
        fecha_desde: fecha_desde || null,
        fecha_hasta: fecha_hasta || null,
        lecturas: lecturas,
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }
    try {
      const fn = (this.mqttService as any).subscribeTopic;
      if (typeof fn === 'function') {
        fn.call(this.mqttService, topic);
        return res
          .status(HttpStatus.OK)
          .json({ message: `Suscrito al topic ${topic}` });
      }
      return res
        .status(HttpStatus.NOT_IMPLEMENTED)
        .json({ message: 'La función subscribeTopic no está disponible.' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'No se pudo suscribir al topic', error: String(e) });
    }
  }

  @Get('iot/info')
  async obtenerInfoIoT() {
    try {
      const sensores =
        await this.reportsService.obtenerSensoresConUbicaciones();
      const bombaData =
        await this.reportsService.contarActivacionesBombaPorPeriodo();

      return {
        sensores: sensores,
        resumen_bomba: bombaData,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return {
        message: 'No se pudo obtener la información IoT',
        error: String(e),
      };
    }
  }

  @Post('unsubscribe')
  async unsubscribeLegacy(@Body('topic') topic: string, @Res() res: Response) {
    if (!topic) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }
    try {
      const fn = (this.mqttService as any).unsubscribeTopic;
      if (typeof fn === 'function') {
        fn.call(this.mqttService, topic);
        return res
          .status(HttpStatus.OK)
          .json({ message: `Desuscrito del topic ${topic}` });
      }
      return res
        .status(HttpStatus.NOT_IMPLEMENTED)
        .json({ message: 'La función unsubscribeTopic no está disponible.' });
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo desuscribir del topic',
        error: String(e),
      });
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }

    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(desde);
    const dHasta = parse(hasta);
    if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildExcelGeneralPorTopic(
        topic,
        dDesde,
        dHasta,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_general_${encodeURIComponent(topic)}.xlsx`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el Excel general',
        error: String(e),
      });
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }
    if (!metric) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "metric" es obligatorio.' });
    }

    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(desde);
    const dHasta = parse(hasta);
    if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildExcelPorTopic(
        topic,
        metric,
        dDesde,
        dHasta,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_${encodeURIComponent(metric)}_${encodeURIComponent(topic)}.xlsx`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el Excel por métrica',
        error: String(e),
      });
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
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "topic" es obligatorio.' });
    }
    if (!metric) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'El parámetro "metric" es obligatorio.' });
    }

    const parse = (s?: string) => (s ? new Date(s) : undefined);
    const dDesde = parse(desde);
    const dHasta = parse(hasta);
    if (desde && (!dDesde || isNaN(dDesde.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "desde" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }
    if (hasta && (!dHasta || isNaN(dHasta.getTime()))) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          'Formato de fecha "hasta" inválido. Use ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss).',
      });
    }

    try {
      const buffer = await this.reportsService.buildPDFPorTopic(
        topic,
        metric,
        dDesde,
        dHasta,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_${encodeURIComponent(metric)}_${encodeURIComponent(topic)}.pdf`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'No se pudo generar el PDF por métrica',
        error: String(e),
      });
    }
  }

  @Post('arduino-data')
  async procesarDatosArduino(@Body() datosArduino: {
    temperatura: number;
    humedad_aire: number;
    humedad_suelo_adc: number;
    bomba_estado?: string;
    sistema?: string;
  }) {
    try {
      // Procesar solo los datos de sensores relevantes
      await this.sensoresService.procesarDatosArduino({
        temperatura: datosArduino.temperatura,
        humedad_aire: datosArduino.humedad_aire,
        humedad_suelo_adc: datosArduino.humedad_suelo_adc
      });

      return {
        success: true,
        message: 'Datos de Arduino procesados correctamente',
        datos_procesados: {
          temperatura: datosArduino.temperatura,
          humedad_aire: datosArduino.humedad_aire,
          humedad_suelo_adc: datosArduino.humedad_suelo_adc
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error procesando datos de Arduino',
        error: error.message
      };
    }
  }
}
