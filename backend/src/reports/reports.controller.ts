import { Controller, Get, Post, Body, Res, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { CropReportService } from './services/crop-report.service';
import { ReportExporterService } from './services/report-exporter.service';

@Controller('api/reportes')
@UseInterceptors(ClassSerializerInterceptor)
export class ReportsController {
  constructor(
    private readonly reportService: CropReportService,
    private readonly reportExporter: ReportExporterService
  ) {}

  @Post('exportar/pdf')
  async exportPdf(
    @Body() filters: ReportFiltersDto,
    @Res() res: Response
  ) {
    try {
      const report = await this.reportService.generarReporteCultivo(filters);
      const pdf = await this.reportExporter.generarPdf(report);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${Date.now()}.pdf`);
      res.send(pdf);
    } catch (error) {
      res.status(500).json({
        message: 'Error al generar el reporte PDF',
        error: error.message
      });
    }
  }

  @Post('exportar/excel')
  async exportExcel(
    @Body() filters: ReportFiltersDto,
    @Res() res: Response
  ) {
    try {
      const report = await this.reportService.generarReporteCultivo(filters);
      const excel = await this.reportExporter.generarExcel(report);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${Date.now()}.xlsx`);
      res.send(excel);
    } catch (error) {
      res.status(500).json({
        message: 'Error al generar el reporte Excel',
        error: error.message
      });
    }
  }

  @Get('opciones-filtros')
  async getFilterOptions() {
    return {
      metricas: ['temperatura', 'humedad_aire', 'humedad_suelo']
    };
  }
}
