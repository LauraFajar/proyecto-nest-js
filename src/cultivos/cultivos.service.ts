import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cultivo } from './entities/cultivo.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Sensor } from '../sensores/entities/sensor.entity';
import { Sublote } from '../sublotes/entities/sublote.entity';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';
import { PaginationDto } from './dto/pagination.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class CultivosService {
  constructor(
    @InjectRepository(Cultivo)
    private readonly cultivoRepository: Repository<Cultivo>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(Sensor)
    private readonly sensoresRepository: Repository<Sensor>,
    @InjectRepository(Sublote)
    private readonly subloteRepository: Repository<Sublote>,
  ) {}

  async create(createCultivoDto: CreateCultivoDto) {
    if (createCultivoDto.id_lote) {
      const loteExists = await this.loteRepository.exist({ where: { id_lote: createCultivoDto.id_lote } });
      if (!loteExists) {
        throw new NotFoundException(`Lote con ID ${createCultivoDto.id_lote} no encontrado`);
      }
    }

    if (createCultivoDto.id_insumo) {
      const insumoExists = await this.insumoRepository.exist({ where: { id_insumo: createCultivoDto.id_insumo } });
      if (!insumoExists) {
        throw new NotFoundException(`Insumo con ID ${createCultivoDto.id_insumo} no encontrado`);
      }
    }

    const cultivo = this.cultivoRepository.create({
      ...createCultivoDto,
      estado_cultivo: createCultivoDto.estado_cultivo || 'sembrado',
    });

    return await this.cultivoRepository.save(cultivo);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const [items, total] = await this.cultivoRepository.findAndCount({
      order: { fecha_siembra: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const cultivo = await this.cultivoRepository.findOne({
      where: { id_cultivo: id },
      relations: ['lote'],
    });
    if (!cultivo) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }
    return cultivo;
  }

  async update(id: number, updateCultivoDto: UpdateCultivoDto) {
    const cultivo = await this.cultivoRepository.findOneBy({ id_cultivo: id });
    
    if (!cultivo) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }

    if (updateCultivoDto.estado_cultivo !== undefined) {
      cultivo.estado_cultivo = updateCultivoDto.estado_cultivo;
    }
    
    if (updateCultivoDto.observaciones !== undefined) {
      cultivo.observaciones = updateCultivoDto.observaciones;
    }

    if (updateCultivoDto.id_lote !== undefined) {
      const lote = await this.loteRepository.findOneBy({ id_lote: updateCultivoDto.id_lote });
      if (!lote) {
        throw new NotFoundException(`Lote con ID ${updateCultivoDto.id_lote} no encontrado`);
      }
      cultivo.lote = lote;
    }

    if (updateCultivoDto.id_insumo !== undefined) {
      if (updateCultivoDto.id_insumo === null) {
        cultivo.insumo = null;
      } else {
        const insumo = await this.insumoRepository.findOneBy({ 
          id_insumo: updateCultivoDto.id_insumo 
        });
        if (!insumo) {
          throw new NotFoundException(`Insumo con ID ${updateCultivoDto.id_insumo} no encontrado`);
        }
        cultivo.insumo = insumo;
      }
    }

    if (updateCultivoDto.fecha_siembra !== undefined) {
      cultivo.fecha_siembra = new Date(updateCultivoDto.fecha_siembra);
    }
    if (updateCultivoDto.fecha_cosecha_estimada !== undefined) {
      cultivo.fecha_cosecha_estimada = updateCultivoDto.fecha_cosecha_estimada 
        ? new Date(updateCultivoDto.fecha_cosecha_estimada)
        : null;
    }
    if (updateCultivoDto.fecha_cosecha_real !== undefined) {
      cultivo.fecha_cosecha_real = updateCultivoDto.fecha_cosecha_real
        ? new Date(updateCultivoDto.fecha_cosecha_real)
        : null;
    }

    if (updateCultivoDto.tipo_cultivo !== undefined) {
      cultivo.tipo_cultivo = updateCultivoDto.tipo_cultivo;
    }

    await this.cultivoRepository.save(cultivo);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.cultivoRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Cultivo con ID ${id} no encontrado`);
    }

    return { message: 'Cultivo eliminado correctamente' };
  }

  async getEstadisticas() {
    const total = await this.cultivoRepository.count();
    
    const porEstado = await this.cultivoRepository
      .createQueryBuilder('cultivo')
      .select('cultivo.estado_cultivo', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('cultivo.estado_cultivo')
      .getRawMany();

    const porTipo = await this.cultivoRepository
      .createQueryBuilder('cultivo')
      .select('cultivo.tipo_cultivo', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .groupBy('cultivo.tipo_cultivo')
      .getRawMany();

    return {
      total,
      por_estado: porEstado,
      por_tipo: porTipo,
    };
  }

  async getCalendario(fecha_desde?: string, fecha_hasta?: string) {
    const query = this.cultivoRepository.createQueryBuilder('cultivo')
      .leftJoinAndSelect('cultivo.lote', 'lote')
      .select([
        'cultivo.id_cultivo',
        'cultivo.nombre_cultivo',
        'cultivo.tipo_cultivo',
        'cultivo.fecha_siembra',
        'cultivo.fecha_cosecha_estimada',
        'cultivo.fecha_cosecha_real',
        'cultivo.estado_cultivo',
        'lote.nombre_lote',
      ]);

    if (fecha_desde && fecha_hasta) {
      query.where('cultivo.fecha_siembra BETWEEN :fecha_desde AND :fecha_hasta', {
        fecha_desde,
        fecha_hasta,
      });
    } else if (fecha_desde) {
      query.where('cultivo.fecha_siembra >= :fecha_desde', { fecha_desde });
    } else if (fecha_hasta) {
      query.where('cultivo.fecha_siembra <= :fecha_hasta', { fecha_hasta });
    }

    return query.getMany();
  }

  async generarReportePdf(id_cultivo: number, fecha_desde?: string, fecha_hasta?: string, historico: boolean = false): Promise<Buffer> {
    const cultivo = await this.cultivoRepository.findOne({ where: { id_cultivo }, relations: ['lote'] });
    if (!cultivo) throw new NotFoundException(`Cultivo con ID ${id_cultivo} no encontrado`);
    const lote = cultivo.lote;

    // Obtener sensores en los sublotes del lote
    const sensores = await this.sensoresRepository.find({ relations: ['id_sublote', 'id_sublote.id_lote'] });
    const sensoresDelLote = sensores.filter(s => s.id_sublote && s.id_sublote.id_lote && (s.id_sublote.id_lote as any).id_lote === (lote ? lote.id_lote : null));

    // Filtrado por fechas
    const desde = fecha_desde ? new Date(fecha_desde) : undefined;
    const hasta = fecha_hasta ? new Date(fecha_hasta) : undefined;

    const calcularStats = (lecturas: any[]) => {
      if (!lecturas || lecturas.length === 0) return { min: null, max: null, avg: null, count: 0 };
      const vals = lecturas.map(l => l.valor);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
      return { min, max, avg, count: lecturas.length };
    };

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título y metadatos
      doc.fontSize(18).text('Reporte de Cultivo', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Cultivo: ${cultivo.nombre_cultivo} (ID: ${cultivo.id_cultivo})`);
      doc.text(`Lote: ${lote ? lote.nombre_lote : 'Sin lote'}`);
      if (historico) {
        doc.text('Tipo de reporte: Histórico completo');
      } else {
        doc.text(`Rango de fechas: ${desde ? desde.toISOString().slice(0,10) : '-'} a ${hasta ? hasta.toISOString().slice(0,10) : '-'}`);
      }
      doc.moveDown(0.5);
      doc.text(`Generado: ${new Date().toLocaleString()}`);
      doc.moveDown(1);

      // Encabezado de tabla
      doc.fontSize(13).text('Sensores asociados al lote');
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text('ID   Tipo Sensor                  Sublote            Lote                Lecturas (min/max/avg, count)');
      doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      sensoresDelLote.forEach((s) => {
        const sub = s.id_sublote;
        const lecturas = (s.historial_lecturas || []).filter((l: any) => {
          const t = new Date(l.timestamp);
          if (historico) return true;
          if (desde && t < desde) return false;
          if (hasta && t > hasta) return false;
          return true;
        });
        const stats = calcularStats(lecturas);
        const linea = `${String(s.id_sensor).padEnd(4)} ${String(s.tipo_sensor).padEnd(26)} ${String(sub?.descripcion || '-').padEnd(18)} ${String((sub?.id_lote as any)?.nombre_lote || '-').padEnd(18)} min:${stats.min ?? '-'} max:${stats.max ?? '-'} avg:${stats.avg ?? '-'} n:${stats.count}`;
        doc.text(linea);
      });

      if (sensoresDelLote.length === 0) {
        doc.text('No hay sensores asociados a este lote.');
      }

      doc.end();
    });
  }
}
