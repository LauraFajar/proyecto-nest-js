import { Controller, Get, Query, BadRequestException, Res } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { Response } from 'express';

@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  @Get('resumen')
  async getResumen(
    @Query('cultivoId') cultivoId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'mes' | 'semana' | 'dia',
  ) {
    if (!cultivoId) {
      throw new BadRequestException('cultivoId es requerido');
    }
    if (!from || !to) {
      throw new BadRequestException('from y to son requeridos (YYYY-MM-DD)');
    }

    const gb = groupBy === 'dia' ? 'dia' : groupBy === 'semana' ? 'semana' : 'mes';
    return this.finanzasService.getResumen(parseInt(cultivoId, 10), from, to, gb);
  }

  @Get('margen')
  async getMargen(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('from y to son requeridos (YYYY-MM-DD)');
    }
    const res = await this.finanzasService.getMargenPorCultivo(from, to);
    const list = Array.isArray((res as any)?.cultivos) ? (res as any).cultivos : Array.isArray(res) ? (res as any) : [];
    const items = list.map((r: any) => ({
      ...r,
      nombre_cultivo: r.nombre ?? r.nombre_cultivo ?? r.cultivo ?? 'Sin cultivo',
    }));
    return { items };
  }

  @Get('rentabilidad')
  async getRentabilidad(
    @Query('cultivoId') cultivoId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('criterio') criterio?: 'margen' | 'bc' | 'porcentaje',
    @Query('umbral') umbral?: string,
  ) {
    if (!cultivoId) {
      throw new BadRequestException('cultivoId es requerido');
    }
    if (!from || !to) {
      throw new BadRequestException('from y to son requeridos (YYYY-MM-DD)');
    }

    const criterioVal: 'margen' | 'bc' | 'porcentaje' | undefined =
      criterio === 'bc' ? 'bc' : criterio === 'porcentaje' ? 'porcentaje' : criterio === 'margen' ? 'margen' : undefined;
    const umbralNum = umbral !== undefined ? Number(umbral) : undefined;

    return this.finanzasService.getRentabilidad(
      parseInt(cultivoId, 10),
      from,
      to,
      criterioVal,
      umbralNum,
    );
  }

  @Get('resumen/excel')
  async exportResumenExcel(
    @Res() res: Response,
    @Query('cultivoId') cultivoId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'mes' | 'semana' | 'dia',
  ) {
    if (!cultivoId) {
      throw new BadRequestException('cultivoId es requerido');
    }
    if (!from || !to) {
      throw new BadRequestException('from y to son requeridos (YYYY-MM-DD)');
    }
    const gb = groupBy === 'dia' ? 'dia' : groupBy === 'semana' ? 'semana' : 'mes';
    const buffer = await this.finanzasService.generateExcelResumen(parseInt(cultivoId, 10), from, to, gb);

    const filename = `resumen-finanzas-${cultivoId}-${from}_a_${to}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  @Get('resumen/pdf')
  async exportResumenPdf(
    @Res() res: Response,
    @Query('cultivoId') cultivoId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'mes' | 'semana' | 'dia',
  ) {
    if (!cultivoId) {
      throw new BadRequestException('cultivoId es requerido');
    }
    if (!from || !to) {
      throw new BadRequestException('from y to son requeridos (YYYY-MM-DD)');
    }
    const gb = groupBy === 'dia' ? 'dia' : groupBy === 'semana' ? 'semana' : 'mes';
    const buffer = await this.finanzasService.generatePdfResumen(parseInt(cultivoId, 10), from, to, gb);

    const filename = `resumen-finanzas-${cultivoId}-${from}_a_${to}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}