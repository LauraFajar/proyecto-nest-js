import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { IotService } from '../services/iot.service';
import { ComprehensiveReportsService } from '../services/comprehensive-reports.service';
import { CreateSensorDto } from '../dto/create-sensor.dto';
import { CreateBrokerDto } from '../dto/create-broker.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('api/iot')
@Public()
export class IotController {
  constructor(
    private readonly iotService: IotService,
    private readonly comprehensiveReportsService: ComprehensiveReportsService
  ) {}

  // Sensor endpoints
  @Get('sensors')
  async getAllSensors() {
    const sensors = await this.iotService.findAllSensors();
    return { sensors };
  }

  @Get('sensors/:id')
  async getSensorById(@Param('id') id: string) {
    const sensor = await this.iotService.findSensorById(id);
    return { sensor };
  }

  @Post('sensors')
  async createSensor(@Body() createSensorDto: CreateSensorDto) {
    const sensor = await this.iotService.createSensor(createSensorDto);
    return { sensor };
  }

  @Get('sensors/topic/:topic')
  async getSensorsByTopic(@Param('topic') topic: string) {
    const sensors = await this.iotService.findSensorsByTopic(topic);
    return { sensors };
  }

  // Reading endpoints
  @Get('readings/:deviceId')
  async getReadings(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
  ) {
    const readings = await this.iotService.getReadingsByDevice(deviceId, limit);
    return { readings };
  }

  @Get('readings/:deviceId/range')
  async getReadingsByTimeRange(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const readings = await this.iotService.getReadingsByTimeRange(
      deviceId,
      new Date(startDate),
      new Date(endDate),
    );
    return { readings };
  }

  // Broker endpoints
  @Get('brokers')
  async getAllBrokers() {
    const brokers = await this.iotService.findAllBrokers();
    return { brokers };
  }

  @Get('brokers/active')
  async getActiveBrokers() {
    const brokers = await this.iotService.findActiveBrokers();
    return { brokers };
  }

  @Post('brokers')
  async createBroker(@Body() createBrokerDto: CreateBrokerDto) {
    const broker = await this.iotService.createBroker(createBrokerDto);
    return { broker };
  }

  @Put('brokers/:id')
  async updateBroker(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateBrokerDto>,
  ) {
    const broker = await this.iotService.updateBroker(id, updateData);
    return { broker };
  }

  @Delete('brokers/:id')
  async deleteBroker(@Param('id') id: string) {
    await this.iotService.deleteBroker(id);
    return { message: 'Broker deleted successfully' };
  }

  // Dashboard endpoints
  @Get('dashboard')
  async getDashboardData() {
    const data = await this.iotService.getDashboardData();
    return data;
  }

  @Get('dashboard/readings')
  async getLatestReadings() {
    const { latestReadings } = await this.iotService.getDashboardData();
    return { readings: latestReadings };
  }

  @Get('dashboard/brokers-status')
  async getBrokersStatus() {
    const { brokerStatus } = await this.iotService.getDashboardData();
    return { brokerStatus };
  }

  // MQTT Control endpoints
  @Post('control')
  async sendMqttControl(@Body() controlData: { command: string; topic?: string }) {
    const { command, topic = 'luixxa/control' } = controlData;
    const result = await this.iotService.sendMqttCommand(command, topic);
    return { success: result, command, topic };
  }

  @Post('control/system')
  async controlSystem(@Body() controlData: { action: 'ON' | 'OFF' }) {
    const command = `SISTEMA_${controlData.action}`;
    const result = await this.iotService.sendMqttCommand(command, 'luixxa/control');
    return { success: result, command };
  }

  @Post('control/pump')
  async controlPump(@Body() controlData: { action: 'ON' | 'OFF' }) {
    const command = `BOMBA_${controlData.action}`;
    const result = await this.iotService.sendMqttCommand(command, 'luixxa/control');
    return { success: result, command };
  }

  // Export endpoints
  @Get('export/pdf')
  async exportPdf(
    @Res() res: Response,
    @Query('sensor') sensor?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string
  ) {
    try {
      const params = {
        sensor: sensor || 'all',
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };

      const result = await this.iotService.exportToPdf(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos reales para exportar.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-agrotic-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Add endpoint to match frontend expectations
  @Get('reporte-iot/pdf')
  async exportIotPdf(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string
  ) {
    try {
      const params = {
        sensor: 'all',
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };

      const result = await this.iotService.exportToPdf(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos reales para exportar.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-iot-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el PDF IoT', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export/excel')
  async exportExcel(
    @Res() res: Response,
    @Query('sensor') sensor?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string
  ) {
    try {
      const params = {
        sensor: sensor || 'all',
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };

      const result = await this.iotService.exportToExcel(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos reales para exportar.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-agrotic-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el Excel', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Add endpoint to match frontend expectations
  @Get('reporte-iot/excel')
  async exportIotExcel(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string
  ) {
    try {
      const params = {
        sensor: 'all',
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };

      const result = await this.iotService.exportToExcel(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos reales para exportar.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-iot-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el Excel IoT', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Historical data for charts
  @Get('historical/:deviceId')
  async getHistoricalData(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string
  ) {
    const data = await this.iotService.getHistoricalData(deviceId, {
      limit,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta
    });
    return data;
  }

  // Comprehensive Report endpoints
  @Get('report/comprehensive')
  async generateComprehensiveReport(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('cultivos') cultivos?: string,
    @Query('incluir_actividades') incluirActividades?: boolean,
    @Query('incluir_finanzas') incluirFinanzas?: boolean,
    @Query('incluir_inventario') incluirInventario?: boolean,
    @Query('incluir_iot') incluirIoT?: boolean,
    @Query('incluir_alertas') incluirAlertas?: boolean,
    @Query('formato') formato?: 'pdf' | 'excel'
  ) {
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        cultivos: cultivos ? cultivos.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)) : [],
        incluir_actividades: incluirActividades === undefined ? true : incluirActividades,
        incluir_finanzas: incluirFinanzas === undefined ? true : incluirFinanzas,
        incluir_inventario: incluirInventario === undefined ? true : incluirInventario,
        incluir_iot: incluirIoT === undefined ? true : incluirIoT,
        incluir_alertas: incluirAlertas === undefined ? true : incluirAlertas
      };

      const result = formato === 'excel' 
        ? await this.comprehensiveReportsService.generateComprehensiveExcel(params)
        : await this.comprehensiveReportsService.generateComprehensivePdf(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos para generar el reporte.', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        message: 'Reporte generado exitosamente',
        format: formato || 'pdf',
        size: result.buffer.length
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error generating comprehensive report:', error);
      throw new HttpException('Error al generar el reporte completo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report/comprehensive/pdf')
  async exportComprehensivePdf(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('cultivos') cultivos?: string,
    @Query('incluir_actividades') incluirActividades?: boolean,
    @Query('incluir_finanzas') incluirFinanzas?: boolean,
    @Query('incluir_inventario') incluirInventario?: boolean,
    @Query('incluir_iot') incluirIoT?: boolean,
    @Query('incluir_alertas') incluirAlertas?: boolean
  ) {
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        cultivos: cultivos ? cultivos.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)) : [],
        incluir_actividades: incluirActividades === undefined ? true : incluirActividades,
        incluir_finanzas: incluirFinanzas === undefined ? true : incluirFinanzas,
        incluir_inventario: incluirInventario === undefined ? true : incluirInventario,
        incluir_iot: incluirIoT === undefined ? true : incluirIoT,
        incluir_alertas: incluirAlertas === undefined ? true : incluirAlertas
      };

      const result = await this.comprehensiveReportsService.generateComprehensivePdf(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos para generar el reporte PDF.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-completo-agrotic-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el PDF completo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report/comprehensive/excel')
  async exportComprehensiveExcel(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('cultivos') cultivos?: string,
    @Query('incluir_actividades') incluirActividades?: boolean,
    @Query('incluir_finanzas') incluirFinanzas?: boolean,
    @Query('incluir_inventario') incluirInventario?: boolean,
    @Query('incluir_iot') incluirIoT?: boolean,
    @Query('incluir_alertas') incluirAlertas?: boolean
  ) {
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        cultivos: cultivos ? cultivos.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)) : [],
        incluir_actividades: incluirActividades === undefined ? true : incluirActividades,
        incluir_finanzas: incluirFinanzas === undefined ? true : incluirFinanzas,
        incluir_inventario: incluirInventario === undefined ? true : incluirInventario,
        incluir_iot: incluirIoT === undefined ? true : incluirIoT,
        incluir_alertas: incluirAlertas === undefined ? true : incluirAlertas
      };

      const result = await this.comprehensiveReportsService.generateComprehensiveExcel(params);

      if (!result.hasData) {
        throw new HttpException('No existen datos para generar el reporte Excel.', HttpStatus.NOT_FOUND);
      }

      const filename = `reporte-completo-agrotic-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error al generar el Excel completo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}