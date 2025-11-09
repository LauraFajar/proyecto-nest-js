import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso } from '../ingresos/entities/ingreso.entity';
import { Salida } from '../salidas/entities/salida.entity';
import { Actividad } from '../actividades/entities/actividad.entity';
import { Cultivo } from '../cultivos/entities/cultivo.entity';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { PassThrough } from 'stream';

type GroupBy = 'mes' | 'semana' | 'dia';

@Injectable()
export class FinanzasService {
  constructor(
    @InjectRepository(Ingreso) private readonly ingresosRepo: Repository<Ingreso>,
    @InjectRepository(Salida) private readonly salidasRepo: Repository<Salida>,
    @InjectRepository(Actividad) private readonly actividadesRepo: Repository<Actividad>,
    @InjectRepository(Cultivo) private readonly cultivoRepo: Repository<Cultivo>,
  ) {}

  private toNumber(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  }

  private fmt(v: number): string {
    return v.toFixed(2);
  }

  async getResumen(cultivoId: number, from: string, to: string, groupBy: GroupBy) {
    const ingresosRow = await this.ingresosRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.monto), 0)', 'total')
      .where('i.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('i.fecha_ingreso BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const salidasRow = await this.salidasRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.cantidad * COALESCE(s.valor_unidad, 0)), 0)', 'total')
      .where('s.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('s.fecha_salida BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const actividadesRow = await this.actividadesRepo
      .createQueryBuilder('a')
      .select(
        "COALESCE(SUM(COALESCE(a.costo_mano_obra, '0')::numeric + COALESCE(a.costo_maquinaria, '0')::numeric), 0)",
        'total',
      )
      .where('a.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('a.fecha BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const ingresos = this.toNumber(ingresosRow?.total);
    const salidas = this.toNumber(salidasRow?.total);
    const actividades = this.toNumber(actividadesRow?.total);
    const egresos = salidas + actividades;
    const margen = ingresos - egresos;

    const trunc = groupBy === 'dia' ? 'day' : groupBy === 'semana' ? 'week' : 'month';
    const fmt = groupBy === 'dia' ? 'YYYY-MM-DD' : groupBy === 'semana' ? 'IYYY-IW' : 'YYYY-MM';

    const ingresosSeries = await this.ingresosRepo
      .createQueryBuilder('i')
      .select(`to_char(date_trunc('${trunc}', i.fecha_ingreso), '${fmt}')`, 'periodo')
      .addSelect('SUM(i.monto)', 'ingresos')
      .where('i.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('i.fecha_ingreso BETWEEN :from AND :to', { from, to })
      .groupBy(`date_trunc('${trunc}', i.fecha_ingreso)`) 
      .orderBy(`date_trunc('${trunc}', i.fecha_ingreso)`, 'ASC')
      .getRawMany();

    const salidasSeries = await this.salidasRepo
      .createQueryBuilder('s')
      .select(`to_char(date_trunc('${trunc}', s.fecha_salida), '${fmt}')`, 'periodo')
      .addSelect('SUM(s.cantidad * COALESCE(s.valor_unidad, 0))', 'salidas')
      .where('s.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('s.fecha_salida BETWEEN :from AND :to', { from, to })
      .groupBy(`date_trunc('${trunc}', s.fecha_salida)`) 
      .orderBy(`date_trunc('${trunc}', s.fecha_salida)`, 'ASC')
      .getRawMany();

    const actividadesSeries = await this.actividadesRepo
      .createQueryBuilder('a')
      .select(`to_char(date_trunc('${trunc}', a.fecha), '${fmt}')`, 'periodo')
      .addSelect(
        "SUM(COALESCE(a.costo_mano_obra, '0')::numeric + COALESCE(a.costo_maquinaria, '0')::numeric)",
        'actividades',
      )
      .where('a.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('a.fecha BETWEEN :from AND :to', { from, to })
      .groupBy(`date_trunc('${trunc}', a.fecha)`) 
      .orderBy(`date_trunc('${trunc}', a.fecha)`, 'ASC')
      .getRawMany();

    const map = new Map<string, { ingresos: number; egresos: number }>();
    ingresosSeries.forEach(r => {
      const key = r.periodo as string;
      const val = this.toNumber(r.ingresos);
      map.set(key, { ingresos: val, egresos: map.get(key)?.egresos ?? 0 });
    });
    salidasSeries.forEach(r => {
      const key = r.periodo as string;
      const val = this.toNumber(r.salidas);
      const cur = map.get(key) ?? { ingresos: 0, egresos: 0 };
      cur.egresos += val;
      map.set(key, cur);
    });
    actividadesSeries.forEach(r => {
      const key = r.periodo as string;
      const val = this.toNumber(r.actividades);
      const cur = map.get(key) ?? { ingresos: 0, egresos: 0 };
      cur.egresos += val;
      map.set(key, cur);
    });

    const series = Array.from(map.entries()).map(([periodo, vals]) => ({
      periodo,
      ingresos: this.fmt(vals.ingresos),
      egresos: this.fmt(vals.egresos),
      margen: this.fmt(vals.ingresos - vals.egresos),
    }));

    const categoriasGasto = [
      { nombre: 'Insumos/Salidas', total: this.fmt(salidas) },
      { nombre: 'Actividades', total: this.fmt(actividades) },
    ];

    return {
      ingresosTotal: this.fmt(ingresos),
      egresosTotal: this.fmt(egresos),
      margenTotal: this.fmt(margen),
      series,
      categoriasGasto,
    };
  }

  async generateExcelResumen(cultivoId: number, from: string, to: string, groupBy: GroupBy): Promise<Buffer> {
    const data = await this.getResumen(cultivoId, from, to, groupBy);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumen Finanzas');

    sheet.addRow([`Resumen Finanzas - Cultivo ${cultivoId}`]);
    sheet.addRow([`Rango`, `${from} a ${to}`]);
    sheet.addRow([]);

    sheet.addRow(['Totales']);
    sheet.addRow(['Ingresos', Number(data.ingresosTotal)]);
    sheet.addRow(['Egresos', Number(data.egresosTotal)]);
    sheet.addRow(['Margen', Number(data.margenTotal)]);
    sheet.addRow([]);

    sheet.addRow(['Categorias de Gasto']);
    sheet.addRow(['Nombre', 'Total']);
    for (const c of data.categoriasGasto) {
      sheet.addRow([c.nombre, Number(c.total)]);
    }
    sheet.addRow([]);

    sheet.addRow(['Series']);
    sheet.addRow(['Periodo', 'Ingresos', 'Egresos', 'Margen']);
    for (const s of data.series) {
      sheet.addRow([s.periodo, Number(s.ingresos), Number(s.egresos), Number(s.margen)]);
    }

    sheet.getColumn(1).width = 24;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 18;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePdfResumen(cultivoId: number, from: string, to: string, groupBy: GroupBy): Promise<Buffer> {
    const data = await this.getResumen(cultivoId, from, to, groupBy);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    doc.pipe(stream);

    doc.fontSize(16).text(`Resumen Finanzas - Cultivo ${cultivoId}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Rango: ${from} a ${to}`);

    doc.moveDown();
    doc.fontSize(13).text('Totales');
    doc.fontSize(12).text(`Ingresos: ${data.ingresosTotal}`);
    doc.text(`Egresos: ${data.egresosTotal}`);
    doc.text(`Margen: ${data.margenTotal}`);

    doc.moveDown();
    doc.fontSize(13).text('Categorias de Gasto');
    data.categoriasGasto.forEach(c => {
      doc.fontSize(12).text(`${c.nombre}: ${c.total}`);
    });

    doc.moveDown();
    doc.fontSize(13).text('Series');
    doc.fontSize(11);
    doc.text('Periodo            Ingresos      Egresos      Margen');
    doc.moveDown(0.2);
    data.series.forEach(s => {
      const line = `${s.periodo.padEnd(18)} ${s.ingresos.toString().padEnd(12)} ${s.egresos.toString().padEnd(12)} ${s.margen.toString().padEnd(12)}`;
      doc.text(line);
    });

    doc.end();

    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async getMargenPorCultivo(from: string, to: string) {
    const ingresos = await this.ingresosRepo
      .createQueryBuilder('i')
      .select('i.id_cultivo', 'id_cultivo')
      .addSelect('COALESCE(SUM(i.monto), 0)', 'ingresos')
      .where('i.fecha_ingreso BETWEEN :from AND :to', { from, to })
      .groupBy('i.id_cultivo')
      .getRawMany();

    const salidas = await this.salidasRepo
      .createQueryBuilder('s')
      .select('s.id_cultivo', 'id_cultivo')
      .addSelect('COALESCE(SUM(s.cantidad * COALESCE(s.valor_unidad, 0)), 0)', 'salidas')
      .where('s.fecha_salida BETWEEN :from AND :to', { from, to })
      .groupBy('s.id_cultivo')
      .getRawMany();

    const actividades = await this.actividadesRepo
      .createQueryBuilder('a')
      .select('a.id_cultivo', 'id_cultivo')
      .addSelect(
        "COALESCE(SUM(COALESCE(a.costo_mano_obra, '0')::numeric + COALESCE(a.costo_maquinaria, '0')::numeric), 0)",
        'actividades',
      )
      .where('a.fecha BETWEEN :from AND :to', { from, to })
      .groupBy('a.id_cultivo')
      .getRawMany();

    const map = new Map<number, { ingresos: number; egresos: number }>();
    ingresos.forEach(r => {
      const id = Number(r.id_cultivo) || 0;
      map.set(id, { ingresos: this.toNumber(r.ingresos), egresos: 0 });
    });
    salidas.forEach(r => {
      const id = Number(r.id_cultivo) || 0;
      const cur = map.get(id) ?? { ingresos: 0, egresos: 0 };
      cur.egresos += this.toNumber(r.salidas);
      map.set(id, cur);
    });
    actividades.forEach(r => {
      const id = Number(r.id_cultivo) || 0;
      const cur = map.get(id) ?? { ingresos: 0, egresos: 0 };
      cur.egresos += this.toNumber(r.actividades);
      map.set(id, cur);
    });

    const ids = Array.from(map.keys()).filter(id => id !== 0);
    const cultivos = ids.length
      ? await this.cultivoRepo
          .createQueryBuilder('c')
          .select(['c.id_cultivo', 'c.nombre_cultivo'])
          .where('c.id_cultivo IN (:...ids)', { ids })
          .getMany()
      : [];
    const nameById = new Map<number, string>(cultivos.map(c => [c.id_cultivo, c.nombre_cultivo]));

    const result = Array.from(map.entries()).map(([id_cultivo, vals]) => ({
      id_cultivo,
      nombre: nameById.get(id_cultivo) || 'Sin cultivo',
      ingresos: this.fmt(vals.ingresos),
      egresos: this.fmt(vals.egresos),
      margen: this.fmt(vals.ingresos - vals.egresos),
    }));

    return { cultivos: result };
  }

  async getRentabilidad(
    cultivoId: number,
    from: string,
    to: string,
    criterio?: 'margen' | 'bc' | 'porcentaje',
    umbral?: number,
  ) {
    const ingresosRow = await this.ingresosRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.monto), 0)', 'total')
      .where('i.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('i.fecha_ingreso BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const salidasRow = await this.salidasRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.cantidad * COALESCE(s.valor_unidad, 0)), 0)', 'total')
      .where('s.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('s.fecha_salida BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const actividadesRow = await this.actividadesRepo
      .createQueryBuilder('a')
      .select(
        "COALESCE(SUM(COALESCE(a.costo_mano_obra, '0')::numeric + COALESCE(a.costo_maquinaria, '0')::numeric), 0)",
        'total',
      )
      .where('a.id_cultivo = :cultivoId', { cultivoId })
      .andWhere('a.fecha BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const ingresos = this.toNumber(ingresosRow?.total);
    const salidas = this.toNumber(salidasRow?.total);
    const actividades = this.toNumber(actividadesRow?.total);
    const egresos = salidas + actividades;
    const margen = ingresos - egresos;

    const beneficioCosto = egresos > 0 ? ingresos / egresos : null;
    const margenPorcentaje = ingresos > 0 ? (margen / ingresos) * 100 : null;

    // Determinar rentabilidad según criterio/umbral opcional
    let rentable: boolean;
    const criterioEval = criterio || 'margen';
    const umbralEval = umbral !== undefined ? umbral : (criterioEval === 'bc' ? 1 : 0);

    if (criterioEval === 'bc') {
      rentable = beneficioCosto !== null ? beneficioCosto >= umbralEval : false;
    } else if (criterioEval === 'porcentaje') {
      rentable = margenPorcentaje !== null ? margenPorcentaje >= umbralEval : false;
    } else {
      rentable = margen >= umbralEval; 
    }

    return {
      ingresos: this.fmt(ingresos),
      egresos: this.fmt(egresos),
      margen: this.fmt(margen),
      beneficioCosto: beneficioCosto === null ? null : this.fmt(beneficioCosto),
      margenPorcentaje: margenPorcentaje === null ? null : this.fmt(margenPorcentaje),
      rentable,
      criterio: criterioEval,
      umbral: umbralEval,
    };
  }
}