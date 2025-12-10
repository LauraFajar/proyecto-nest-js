import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './entities/actividad.entity';
import { CreateActividadeDto } from './dto/create-actividade.dto';
import { UpdateActividadeDto } from './dto/update-actividade.dto';
import { PaginationDto } from './dto/pagination.dto';
import { FotoActividad } from './entities/foto-actividad.entity';
import { CreateFotoDto } from './dto/create-foto.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Utiliza } from '../utiliza/entities/utiliza.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Salida } from '../salidas/entities/salida.entity';
import { MovimientosService } from '../movimientos/movimientos.service';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadesRepository: Repository<Actividad>,
    @InjectRepository(FotoActividad)
    private readonly fotoActividadRepository: Repository<FotoActividad>,
    @InjectRepository(Utiliza)
    private readonly utilizaRepository: Repository<Utiliza>,
    @InjectRepository(Insumo)
    private readonly insumosRepository: Repository<Insumo>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Salida)
    private readonly salidasRepository: Repository<Salida>,
    private readonly movimientosService: MovimientosService,
  ) {}

  async create(createActividadDto: CreateActividadeDto) {
    const cultivoExists = await this.actividadesRepository.manager
      .createQueryBuilder()
      .select('1')
      .from('cultivos', 'c')
      .where('c.id_cultivo = :id', { id: createActividadDto.id_cultivo })
      .getRawOne();
      
    if (!cultivoExists) {
      throw new NotFoundException(`Cultivo con ID ${createActividadDto.id_cultivo} no encontrado`);
    }

    const actividadData: Partial<Actividad> = {
      tipo_actividad: createActividadDto.tipo_actividad,
      fecha: new Date(createActividadDto.fecha),
      responsable: createActividadDto.responsable,
      detalles: createActividadDto.detalles,
      estado: createActividadDto.estado || 'pendiente',
      id_cultivo: createActividadDto.id_cultivo,
      costo_mano_obra: createActividadDto.costo_mano_obra != null ? String(createActividadDto.costo_mano_obra) : undefined,
      costo_maquinaria: createActividadDto.costo_maquinaria != null ? String(createActividadDto.costo_maquinaria) : undefined,
      horas_trabajadas: createActividadDto.horas_trabajadas != null ? String(createActividadDto.horas_trabajadas) : undefined,
      tarifa_hora: createActividadDto.tarifa_hora != null ? String(createActividadDto.tarifa_hora) : undefined,
    };

    if (actividadData.costo_mano_obra == null && createActividadDto.horas_trabajadas != null && createActividadDto.tarifa_hora != null) {
      const horas = Number(createActividadDto.horas_trabajadas || 0);
      const tarifa = Number(createActividadDto.tarifa_hora || 0);
      const total = horas * tarifa;
      actividadData.costo_mano_obra = String(total);
    }

    if (createActividadDto.responsable_id) {
      const user = await this.actividadesRepository.manager
        .createQueryBuilder()
        .select(['nombres'])
        .from('usuarios', 'u')
        .where('u.id_usuarios = :id', { id: createActividadDto.responsable_id })
        .getRawOne();
      actividadData.responsable_id = createActividadDto.responsable_id;
      if (user && user.nombres) {
        actividadData.responsable = user.nombres;
      }
    }

    const actividad = this.actividadesRepository.create(actividadData);
    const saved = await this.actividadesRepository.save(actividad);

    const recursos = (createActividadDto as any).recursos as Array<{ id_insumo: number; cantidad?: number; horas_uso?: number; costo_unitario?: number }> | undefined;
    if (Array.isArray(recursos) && recursos.length > 0) {
      let totalDepreciacion = 0;
      let totalHerramientasCosto = 0;
      for (const r of recursos) {
        if (!r?.id_insumo) continue;
        const insumo = await this.insumosRepository.findOne({ where: { id_insumo: r.id_insumo } });
        if (!insumo) continue;

        const utiliza = this.utilizaRepository.create({
          id_actividades: saved,
          id_insumo: insumo,
          cantidad: r.cantidad != null ? String(r.cantidad) : undefined,
          horas_uso: r.horas_uso != null ? String(r.horas_uso) : undefined,
          costo_unitario: r.costo_unitario != null ? String(r.costo_unitario) : undefined,
        });
        await this.utilizaRepository.save(utiliza);

        if (insumo.es_herramienta || insumo.tipo_insumo === 'herramienta') {
          const horas = Number(r.horas_uso || 0);
          if (horas > 0) {
            const costoCompra = Number(insumo.costo_compra || 0);
            const vidaHoras = Number(insumo.vida_util_horas || 0);
            let depHora = Number(insumo.depreciacion_por_hora || 0);
            if (!depHora && costoCompra > 0 && vidaHoras > 0) {
              depHora = costoCompra / vidaHoras;
            }
            const depActividad = depHora * horas;
            const acumPrev = Number(insumo.depreciacion_acumulada || 0);
            const acumNext = Math.min(costoCompra || Infinity, acumPrev + depActividad);
            insumo.depreciacion_acumulada = String(acumNext);
            await this.insumosRepository.save(insumo);
            totalDepreciacion += depActividad;

            const costoHora = r.costo_unitario != null ? Number(r.costo_unitario) : Number(insumo.depreciacion_por_hora || 0);
            if (costoHora > 0) {
              totalHerramientasCosto += horas * costoHora;
            }
          }
        } else {
          const cant = Number(r.cantidad || 0);
          if (cant > 0) {
            const inv = await this.inventarioRepository.findOne({ where: { id_insumo: insumo.id_insumo } });
            if (inv) {
              const stockPrev = Number(inv.cantidad_stock || 0);
              const next = stockPrev - cant;
              if (next < 0) {
                // no lanzar; limitar a cero
                inv.cantidad_stock = 0;
              } else {
                inv.cantidad_stock = next;
              }
              await this.inventarioRepository.save(inv);
            }

            try {
              const valorUnidad = r.costo_unitario != null ? Number(r.costo_unitario) : null;
              const salida = this.salidasRepository.create({
                nombre: insumo.nombre_insumo,
                codigo: insumo.codigo,
                cantidad: cant,
                observacion: `Salida automática por actividad ${saved.id_actividad}`,
                fecha_salida: new Date(createActividadDto.fecha).toISOString().slice(0, 10),
                unidad_medida: undefined,
                id_cultivo: saved.id_cultivo,
                insumo: insumo as any,
                valor_unidad: valorUnidad,
              } as any);
              await this.salidasRepository.save(salida);
              try {
                await this.movimientosService.create({
                  tipo_movimiento: 'Salida',
                  id_insumo: insumo.id_insumo,
                  cantidad: cant,
                  unidad_medida: (inv as any)?.unidad_medida || 'unidad',
                  fecha_movimiento: new Date(createActividadDto.fecha).toISOString().slice(0, 10),
                  valor_unidad: valorUnidad ?? undefined,
                } as any);
              } catch {}
            } catch (err) {
            }
          }
        }
      }

      const sumaMaquinaria = Number(saved.costo_maquinaria || 0) + Number(totalDepreciacion || 0) + Number(totalHerramientasCosto || 0);
      if (sumaMaquinaria > 0) {
        saved.costo_maquinaria = String(sumaMaquinaria);
        await this.actividadesRepository.save(saved);
      }
    }

    return saved;
  }

  async handlePhotoUpload(actividadId: number, photo: Express.Multer.File) {
    const actividad = await this.findOne(actividadId);
    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${actividadId} no encontrada`);
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'actividades');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let fileName = photo?.filename;
    const filePathFromMulter = photo?.path ? path.join(process.cwd(), photo.path) : null;
    if (filePathFromMulter && !fs.existsSync(filePathFromMulter) && photo?.buffer) {
      // Multer entregó path pero el archivo no existe; escribir buffer
      const fallbackPath = path.join(uploadDir, fileName || `${Date.now()}-${photo?.originalname || 'foto.jpg'}`);
      fs.writeFileSync(fallbackPath, photo.buffer);
      if (!fileName) fileName = path.basename(fallbackPath);
    }
    if (!fileName) {
      fileName = `${Date.now()}-${photo?.originalname || 'foto.jpg'}`;
      const filePath = path.join(uploadDir, fileName);
      if (photo?.buffer) {
        fs.writeFileSync(filePath, photo.buffer);
      }
    }

    const url = `/uploads/actividades/${fileName}`;

    const newPhoto = this.fotoActividadRepository.create({
      url_imagen: url,
      actividad: actividad,
    });

    return this.fotoActividadRepository.save(newPhoto);
  }

  async findAll(id_cultivo?: number, paginationDto?: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const query = this.actividadesRepository.createQueryBuilder('actividad');

    if (id_cultivo) {
      query.where('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async findAllWithoutPagination(id_cultivo?: number): Promise<Actividad[]> {
    const query = this.actividadesRepository.createQueryBuilder('actividad');
    
    if (id_cultivo) {
      query.where('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    return query.getMany();
  }

  async findOne(id_actividad: number) {
    const actividad = await this.actividadesRepository.findOne({
      where: { id_actividad },
      relations: ['fotos'],
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
    }
    return actividad;
  }

  async update(id_actividad: number, updateActividadDto: UpdateActividadeDto) {
    const actividad = await this.findOne(id_actividad);
    if (!actividad) {
      throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
    }

    const updateData: Partial<Actividad> = {};
    
    if (updateActividadDto.tipo_actividad) {
      updateData.tipo_actividad = updateActividadDto.tipo_actividad;
    }
    if (updateActividadDto.fecha) {
      updateData.fecha = new Date(updateActividadDto.fecha);
    }
    if (updateActividadDto.responsable_id) {
      const user = await this.actividadesRepository.manager
        .createQueryBuilder()
        .select(['nombres'])
        .from('usuarios', 'u')
        .where('u.id_usuarios = :id', { id: updateActividadDto.responsable_id })
        .getRawOne();
      updateData.responsable_id = updateActividadDto.responsable_id;
      if (user && user.nombres) {
        updateData.responsable = user.nombres;
      }
    } else if (updateActividadDto.responsable) {
      updateData.responsable = updateActividadDto.responsable;
    }
    if (updateActividadDto.detalles) {
      updateData.detalles = updateActividadDto.detalles;
    }
    if (updateActividadDto.estado) {
      updateData.estado = updateActividadDto.estado;
    }
    if (updateActividadDto.id_cultivo) {
      updateData.id_cultivo = updateActividadDto.id_cultivo;
    }
    if (updateActividadDto.horas_trabajadas != null) {
      updateData.horas_trabajadas = String(updateActividadDto.horas_trabajadas);
    }
    if (updateActividadDto.tarifa_hora != null) {
      updateData.tarifa_hora = String(updateActividadDto.tarifa_hora);
    }
    if (updateActividadDto.costo_mano_obra != null) {
      updateData.costo_mano_obra = String(updateActividadDto.costo_mano_obra);
    } else if (updateActividadDto.horas_trabajadas != null && updateActividadDto.tarifa_hora != null) {
      const horas = Number(updateActividadDto.horas_trabajadas || 0);
      const tarifa = Number(updateActividadDto.tarifa_hora || 0);
      const total = horas * tarifa;
      updateData.costo_mano_obra = String(total);
    }
    if (updateActividadDto.costo_maquinaria != null) {
      updateData.costo_maquinaria = String(updateActividadDto.costo_maquinaria);
    }

    Object.assign(actividad, updateData);
    const saved = await this.actividadesRepository.save(actividad);

    const recursos = (updateActividadDto as any).recursos as Array<{ id_insumo: number; cantidad?: number; horas_uso?: number; costo_unitario?: number }> | undefined;
    console.log(`[ActividadesService] UPDATE: Recursos recibidos:`, JSON.stringify(recursos, null, 2));
    
    if (Array.isArray(recursos)) {
      console.log(`[ActividadesService] UPDATE: Es array de recursos, procesando...`);
      const existentes = await this.utilizaRepository.find({
        where: { id_actividades: { id_actividad } },
        relations: ['id_insumo'],
      });
      const byInsumo = new Map<number, typeof existentes[number]>();
      existentes.forEach(u => {
        const id = Number((u.id_insumo as any)?.id_insumo);
        if (id) byInsumo.set(id, u);
      });

      const incomingIds = new Set<number>();
      for (const r of recursos) {
        if (!r?.id_insumo) continue;
        incomingIds.add(Number(r.id_insumo));
        const insumo = await this.insumosRepository.findOne({ where: { id_insumo: Number(r.id_insumo) } });
        if (!insumo) continue;
        const existente = byInsumo.get(Number(r.id_insumo));
        if (existente) {
          existente.cantidad = r.cantidad != null ? String(r.cantidad) : undefined;
          existente.horas_uso = r.horas_uso != null ? String(r.horas_uso) : undefined;
          existente.costo_unitario = r.costo_unitario != null ? String(r.costo_unitario) : undefined;
          await this.utilizaRepository.save(existente);
        } else {
          const nuevo = this.utilizaRepository.create({
            id_actividades: saved,
            id_insumo: insumo,
            cantidad: r.cantidad != null ? String(r.cantidad) : undefined,
            horas_uso: r.horas_uso != null ? String(r.horas_uso) : undefined,
            costo_unitario: r.costo_unitario != null ? String(r.costo_unitario) : undefined,
          });
          await this.utilizaRepository.save(nuevo);
        }
      }

      for (const u of existentes) {
        const idInsumo = Number((u.id_insumo as any)?.id_insumo);
        if (idInsumo && !incomingIds.has(idInsumo)) {
          await this.utilizaRepository.remove(u);
        }
      }

      console.log(`[ActividadesService] Actualizando inventario para la actividad ${id_actividad}`);
      
      const recursosMap = new Map<number, typeof recursos[number]>();
      recursos.forEach(r => {
        if (r?.id_insumo) recursosMap.set(Number(r.id_insumo), r);
      });

      for (const existente of existentes) {
        const idInsumo = Number((existente.id_insumo as any)?.id_insumo);
        if (!idInsumo) continue;

        const insumo = await this.insumosRepository.findOne({ where: { id_insumo: idInsumo } });
        if (!insumo) continue;

        const nuevoRecurso = recursosMap.get(idInsumo);
        const cantAnterior = Number(existente.cantidad || 0);
        const cantNueva = Number(nuevoRecurso?.cantidad || 0);
        const diferencia = cantNueva - cantAnterior;

        console.log(`[ActividadesService] UPDATE: Insumo ${insumo.nombre_insumo}: es_herramienta=${insumo.es_herramienta}, tipo_insumo=${insumo.tipo_insumo}, diferencia=${diferencia}`);
        
        if (!insumo.es_herramienta && insumo.tipo_insumo !== 'herramienta' && diferencia !== 0) {
            console.log(`[ActividadesService] Insumo ${insumo.nombre_insumo}: Cantidad anterior ${cantAnterior}, nueva ${cantNueva}, diferencia ${diferencia}`);
            const inv = await this.inventarioRepository.findOne({ where: { id_insumo: insumo.id_insumo } });
            if (inv) {
                const stockPrev = Number(inv.cantidad_stock || 0);
                const next = stockPrev - diferencia;
                console.log(`[ActividadesService] Inventario: Stock previo ${stockPrev}, ajuste ${diferencia}, nuevo stock ${next}`);
                inv.cantidad_stock = next;
                await this.inventarioRepository.save(inv);
                console.log(`[ActividadesService] Inventario actualizado correctamente.`);
            } else {
                console.warn(`[ActividadesService] No se encontró registro en inventario para el insumo ID ${insumo.id_insumo}`);
            }
        }
      }
    }

    return saved;
  }

  async addFoto(actividadId: number, filePath: string, createFotoDto: CreateFotoDto): Promise<FotoActividad> {
    const actividad = await this.findOne(actividadId); 
    
    const nuevaFoto = this.fotoActividadRepository.create({
      url_imagen: filePath,
      descripcion: createFotoDto.descripcion,
      actividad: actividad,
    });

    return this.fotoActividadRepository.save(nuevaFoto);
  }

  async getFotosByActividad(actividadId: number): Promise<FotoActividad[]> {
    await this.findOne(actividadId); // Validar que la actividad exista
    return this.fotoActividadRepository.find({
      where: { actividad: { id_actividad: actividadId } },
      order: { fecha_carga: 'DESC' },
    });
  }

  async getRecursosByActividad(actividadId: number) {
    const actividad = await this.findOne(actividadId);
    if (!actividad) throw new NotFoundException(`Actividad con ID ${actividadId} no encontrada`);
    const qb = this.utilizaRepository
      .createQueryBuilder('utiliza')
      .leftJoinAndSelect('utiliza.id_insumo', 'insumo')
      .leftJoinAndSelect('insumo.id_categoria', 'categoria')
      .where('utiliza.id_actividades = :actividadId', { actividadId })
      .orderBy('utiliza.id_utiliza', 'ASC');
    const recursos = await qb.getMany();
    return recursos.map((u) => {
      const ins = (u as any)?.id_insumo;
      const rawFlag = ins?.es_herramienta;
      let es_herramienta = (u.horas_uso != null && String(u.horas_uso) !== '') || rawFlag === true || rawFlag === 1 || rawFlag === '1' ||
        (typeof rawFlag === 'string' && (rawFlag.toLowerCase() === 'true' || rawFlag.toLowerCase() === 't'));
      if (!es_herramienta) {
        const catName = ((ins as any)?.id_categoria?.nombre || '').toString().toLowerCase();
        if (catName.includes('herramienta') || catName.includes('equipo') || catName.includes('maquinaria') || catName.includes('implemento')) {
          es_herramienta = true;
        }
      }
      return {
        id_insumo: Number(ins?.id_insumo ?? ins?.id ?? 0),
        nombre_insumo: ins?.nombre_insumo ?? '',
        es_herramienta,
        cantidad: u.cantidad != null ? Number(u.cantidad) : undefined,
        horas_uso: u.horas_uso != null ? Number(u.horas_uso) : undefined,
        costo_unitario: u.costo_unitario != null ? Number(u.costo_unitario) : undefined,
      };
    });
  }

  async removeFoto(fotoId: number): Promise<void> {
    const foto = await this.fotoActividadRepository.findOne({ where: { id: fotoId } });
    if (!foto) {
      throw new NotFoundException(`Foto con ID ${fotoId} no encontrada.`);
    }
    
    try {
      const fullPath = path.resolve(foto.url_imagen);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error(`Error al borrar el archivo físico ${foto.url_imagen}:`, error);
    }

    await this.fotoActividadRepository.remove(foto);
  }

  async remove(id_actividad: number) {
    return await this.actividadesRepository.delete(id_actividad);
  }

  async obtenerReporteActividades(
    id_cultivo?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
    tipo_actividad?: string,
  ) {
    const query = this.actividadesRepository
      .createQueryBuilder('actividad')
      .orderBy('actividad.fecha', 'DESC');

    if (id_cultivo) {
      query.andWhere('actividad.id_cultivo = :id_cultivo', { id_cultivo });
    }

    if (fecha_inicio) {
      query.andWhere('actividad.fecha >= :fecha_inicio', { 
        fecha_inicio: new Date(fecha_inicio).toISOString() 
      });
    }

    if (fecha_fin) {
      query.andWhere('actividad.fecha <= :fecha_fin', { 
        fecha_fin: new Date(fecha_fin).toISOString() 
      });
    }

    if (tipo_actividad) {
      query.andWhere('actividad.tipo_actividad = :tipo_actividad', { tipo_actividad });
    }

    const actividades = await query.getMany();
    
    let cultivoInfo: { id_cultivo: number; tipo_cultivo: string } | null = null;
    if (id_cultivo) {
      const result = await this.actividadesRepository.manager
        .createQueryBuilder()
        .select(['id_cultivo', 'tipo_cultivo'])
        .from('cultivos', 'c')
        .where('c.id_cultivo = :id', { id: id_cultivo })
        .getRawOne();
      if (result) {
        cultivoInfo = {
          id_cultivo: result.id_cultivo,
          tipo_cultivo: result.tipo_cultivo
        };
      }
    }
    
    return actividades.map(actividad => ({
      id: actividad.id_actividad,
      tipo_actividad: actividad.tipo_actividad,
      fecha: actividad.fecha,
      estado: actividad.estado,
      responsable: actividad.responsable,
      id_cultivo: actividad.id_cultivo,
      costo_mano_obra: actividad.costo_mano_obra,
      costo_maquinaria: actividad.costo_maquinaria,
      cultivo: cultivoInfo ? {
        id: cultivoInfo.id_cultivo,
        tipo: cultivoInfo.tipo_cultivo
      } : null,
      detalles: actividad.detalles
    }));
  }

  async obtenerEstadisticas() {
    const actividades = await this.actividadesRepository.find();

    const estadisticas = {
      total: actividades.length,
      por_estado: {
        completadas: actividades.filter(a => a.estado === 'completada').length,
        pendientes: actividades.filter(a => a.estado === 'pendiente').length,
        en_progreso: actividades.filter(a => a.estado === 'en_progreso').length,
      },
      costo_promedio: 0,
      actividades_por_cultivo: this.agruparPorCultivo(actividades),
    };

    return estadisticas;
  }

  private agruparPorCultivo(actividades: Actividad[]) {
    return actividades.reduce((acc, actividad) => {
      const cultivoId = actividad.cultivo?.id_cultivo?.toString() || 'Sin cultivo';
      acc[cultivoId] = (acc[cultivoId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
