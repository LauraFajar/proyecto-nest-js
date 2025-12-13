import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like } from 'typeorm';
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
import { SalidasService } from '../salidas/salidas.service';
import { MovimientosService } from '../movimientos/movimientos.service';
import { Salida } from '../salidas/entities/salida.entity';

type RecursoDto = { id_insumo: number; cantidad?: number; horas_uso?: number; costo_unitario?: number };

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
    private readonly salidasService: SalidasService, 
    private readonly movimientosService: MovimientosService,
    private readonly dataSource: DataSource,
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
            const inventarioItem = await this.inventarioRepository.findOne({ where: { id_insumo: insumo.id_insumo } });
            if (!inventarioItem) {
              console.error(`Inventario para el insumo ${insumo.nombre_insumo} no encontrado al crear actividad.`);
              continue; 
            }
            try {
              const valorUnidad = r.costo_unitario != null ? Number(r.costo_unitario) : null;
              await this.salidasService.create({
                id_insumo: insumo.id_insumo,
                nombre: insumo.nombre_insumo,
                codigo: insumo.codigo,
                cantidad: cant,
                                   observacion: `Salida autom. act. ID ${saved.id_actividad}`,                fecha_salida: new Date(createActividadDto.fecha).toISOString().slice(0, 10),
                unidad_medida: inventarioItem.unidad_medida, 
                id_cultivo: saved.id_cultivo,
                valor_unidad: valorUnidad ?? undefined, 
              });
            } catch (err) {
              console.error('Error al crear movimiento automático de salida en create (ActividadesService):', err);
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

  async update(id_actividad: number, updateActividadDto: UpdateActividadeDto): Promise<Actividad> {
    const { recursos, ...actividadData } = updateActividadDto as any;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const actividad = await queryRunner.manager.findOne(Actividad, { where: { id_actividad } });
      if (!actividad) {
        throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
      }

      // 1. Actualizar campos de la actividad
      Object.assign(actividad, actividadData);
      await queryRunner.manager.save(actividad);

      // 2. Lógica para actualizar recursos e inventario
      if (Array.isArray(recursos)) {
        const recursosActuales = await queryRunner.manager.find(Utiliza, {
          where: { id_actividades: { id_actividad } },
          relations: ['id_insumo'],
        });

        const actualesMap = new Map(recursosActuales.map(u => [u.id_insumo.id_insumo, u]));
        const nuevosMap = new Map((recursos as RecursoDto[]).map(r => [r.id_insumo, r]));

        // Insumos eliminados: devolver stock
        for (const actual of recursosActuales) {
          if (!nuevosMap.has(actual.id_insumo.id_insumo)) {
            const insumo = actual.id_insumo;
            if (!insumo.es_herramienta && insumo.tipo_insumo !== 'herramienta') {
              const cantidadDevolver = Number(actual.cantidad || 0);
              if (cantidadDevolver > 0) {
                await queryRunner.manager.increment(Inventario, { id_insumo: insumo.id_insumo }, 'cantidad_stock', cantidadDevolver);
              }
            }
            await queryRunner.manager.remove(actual);
          }
        }

        for (const recursoDto of (recursos as RecursoDto[])) {
          const insumo = await queryRunner.manager.findOne(Insumo, { where: { id_insumo: recursoDto.id_insumo } });
          if (!insumo) continue;
          
          if (insumo.es_herramienta || insumo.tipo_insumo === 'herramienta') {
            const actual = actualesMap.get(recursoDto.id_insumo);
            if (actual) {
              actual.cantidad = recursoDto.cantidad != null ? String(recursoDto.cantidad) : undefined;
              actual.horas_uso = recursoDto.horas_uso != null ? String(recursoDto.horas_uso) : undefined;
              actual.costo_unitario = recursoDto.costo_unitario != null ? String(recursoDto.costo_unitario) : undefined;
              await queryRunner.manager.save(actual);
            } else {
              const nuevoUtiliza = queryRunner.manager.create(Utiliza, {
                id_actividades: actividad,
                id_insumo: insumo,
                cantidad: recursoDto.cantidad != null ? String(recursoDto.cantidad) : undefined,
                horas_uso: recursoDto.horas_uso != null ? String(recursoDto.horas_uso) : undefined,
                costo_unitario: recursoDto.costo_unitario != null ? String(recursoDto.costo_unitario) : undefined,
              });
              await queryRunner.manager.save(nuevoUtiliza);
            }
            continue; 
          }

          const actual = actualesMap.get(recursoDto.id_insumo);
          const cantidadAnterior = actual ? Number(actual.cantidad || 0) : 0;
          const cantidadNueva = Number(recursoDto.cantidad || 0);
          const diferencia = cantidadNueva - cantidadAnterior;

          // Ajustar inventario solo para consumibles
          if (diferencia !== 0) {
             const inventario = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumo.id_insumo } });
             if(inventario){
                const stockActual = Number(inventario.cantidad_stock); 
                if (diferencia > 0 && stockActual < diferencia) { 
                    throw new BadRequestException(`Stock insuficiente para ${insumo.nombre_insumo}.`);
                }
                
                if (diferencia > 0) {
                  const inventarioItem = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumo.id_insumo } });
                  if (!inventarioItem) {
                    throw new InternalServerErrorException(`Inventario para el insumo ${insumo.nombre_insumo} no encontrado al actualizar actividad.`);
                  }
                  try {
                    const valorUnidad = recursoDto.costo_unitario != null ? Number(recursoDto.costo_unitario) : null;
                    console.log('DEBUG: Buscando salida existente para actualizar:', {
                      id_insumo: insumo.id_insumo,
                      actividadId: actividad.id_actividad,
                      cantidadNueva: Math.round(cantidadNueva)
                    });
                    
                    const salidaExistente = await queryRunner.manager.findOne(Salida, {
                      where: { 
                        id_cultivo: actividad.id_cultivo,
                        insumo: { id_insumo: insumo.id_insumo },
                        observacion: Like(`%act. ID ${actividad.id_actividad}%`)
                      },
                      relations: ['insumo']
                    });
                    
                    if (salidaExistente) {
                      console.log('DEBUG: Actualizando salida existente ID:', salidaExistente.id_salida);
                      await queryRunner.manager.update(Salida, 
                        salidaExistente.id_salida, 
                        {
                          cantidad: Math.round(cantidadNueva),
                          observacion: `Salida autom. act. ID ${actividad.id_actividad} (actualizado)`,
                          valor_unidad: valorUnidad ?? undefined
                        }
                      );
                      console.log('DEBUG: Salida actualizada exitosamente');
                    } else {
                      console.log('DEBUG: Creando nueva salida (no existía)');
                      await this.salidasService.create({
                        id_insumo: insumo.id_insumo,
                        nombre: insumo.nombre_insumo,
                        codigo: insumo.codigo,
                        cantidad: Math.round(cantidadNueva),
                        observacion: `Salida autom. act. ID ${actividad.id_actividad}`,
                        fecha_salida: new Date().toISOString().slice(0, 10),
                        unidad_medida: inventarioItem.unidad_medida, 
                        id_cultivo: actividad.id_cultivo,
                        valor_unidad: valorUnidad ?? undefined, 
                      }, queryRunner);
                      console.log('DEBUG: Nueva salida creada exitosamente');
                    }
                  } catch (err) {
                    console.error('Error al actualizar/crear salida automática en update (ActividadesService):', err);
                    throw new InternalServerErrorException('Error al registrar la salida automática: ' + err.message);
                  }
                }
                
                if (diferencia < 0) {
                    await queryRunner.manager.increment(Inventario, { id_insumo: insumo.id_insumo }, 'cantidad_stock', Math.abs(diferencia));
                }
             } else {
                 throw new NotFoundException(`Inventario para el insumo ${insumo.nombre_insumo} no encontrado.`);
             }
          }

          if (actual) {
            actual.cantidad = recursoDto.cantidad != null ? String(recursoDto.cantidad) : undefined;
            actual.horas_uso = recursoDto.horas_uso != null ? String(recursoDto.horas_uso) : undefined;
            actual.costo_unitario = recursoDto.costo_unitario != null ? String(recursoDto.costo_unitario) : undefined;
            await queryRunner.manager.save(actual);
          } else { 
            const cantidadNueva = Number(recursoDto.cantidad || 0);
            if (cantidadNueva > 0) {
              const inventarioItem = await queryRunner.manager.findOne(Inventario, { where: { id_insumo: insumo.id_insumo } });
              if (!inventarioItem) {
                throw new InternalServerErrorException(`Inventario para el insumo ${insumo.nombre_insumo} no encontrado al asociar nuevo insumo.`);
              }
              try {
                const valorUnidad = recursoDto.costo_unitario != null ? Number(recursoDto.costo_unitario) : null;
                await this.salidasService.create({
                  id_insumo: insumo.id_insumo,
                  nombre: insumo.nombre_insumo,
                  codigo: insumo.codigo,
                  cantidad: cantidadNueva,
                                     observacion: `Salida autom. nueva asoc. act. ${actividad.id_actividad}`,                  fecha_salida: new Date().toISOString().slice(0, 10),
                  unidad_medida: inventarioItem.unidad_medida, 
                  id_cultivo: actividad.id_cultivo,
                  valor_unidad: valorUnidad ?? undefined, 
                }, queryRunner); 
              } catch (err) {
                console.error('Error al crear movimiento automático de salida para nuevo insumo en update (ActividadesService):', err);
                throw new InternalServerErrorException('Error al registrar la salida automática para nuevo insumo: ' + err.message);
              }
            }

            const nuevoUtiliza = queryRunner.manager.create(Utiliza, {
              id_actividades: actividad,
              id_insumo: insumo,
              cantidad: recursoDto.cantidad != null ? String(recursoDto.cantidad) : undefined,
              horas_uso: recursoDto.horas_uso != null ? String(recursoDto.horas_uso) : undefined,
              costo_unitario: recursoDto.costo_unitario != null ? String(recursoDto.costo_unitario) : undefined,
            });
            await queryRunner.manager.save(nuevoUtiliza);
          }
        }
      }

      await queryRunner.commitTransaction();
      const updatedActividad = await this.findOne(id_actividad); 
      if (!updatedActividad) {
        throw new InternalServerErrorException('No se pudo encontrar la actividad después de la actualización.');
      }
      return updatedActividad;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`[ActividadesService] Error en update:`, error); 
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar la actividad: ' + error.message);
    } finally {
      await queryRunner.release();
    }
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
    await this.findOne(actividadId); 
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

    async remove(id_actividad: number): Promise<void> {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
          const actividad = await queryRunner.manager.findOne(Actividad, { 
              where: { id_actividad },
              relations: ['utilizas', 'utilizas.id_insumo'] 
          });
  
          if (!actividad) {
              throw new NotFoundException(`Actividad con ID ${id_actividad} no encontrada`);
          }
  
          if (actividad.utilizas) {
              for (const uso of actividad.utilizas) {
                  const insumo = uso.id_insumo;
                  if (!insumo.es_herramienta && insumo.tipo_insumo !== 'herramienta') {
                      const cantidadDevolver = Number(uso.cantidad || 0);
                      if (cantidadDevolver > 0) {
                          await queryRunner.manager.increment(Inventario, { id_insumo: insumo.id_insumo }, 'cantidad_stock', cantidadDevolver);
                      }
                  }
              }
              await queryRunner.manager.remove(Utiliza, actividad.utilizas); 
          }
  
          // Eliminar fotos asociadas si es necesario (lógica de fs.unlink)
          const fotos = await queryRunner.manager.find(FotoActividad, { where: { actividad: { id_actividad } } });
          for (const foto of fotos) {
              // Lógica de borrado de archivos físicos si aplica
              try {
                  const fullPath = path.resolve(foto.url_imagen);
                  if (fs.existsSync(fullPath)) {
                      fs.unlinkSync(fullPath);
                  }
              } catch (error) {
                  console.error(`Error al borrar el archivo físico ${foto.url_imagen}:`, error);
              }
              await queryRunner.manager.remove(foto);
          }
  
          await queryRunner.manager.remove(actividad);
          await queryRunner.commitTransaction();
          } catch (error) {
              await queryRunner.rollbackTransaction();
              console.error(`[ActividadesService] Error en remove:`, error); 
              if (error instanceof NotFoundException) {
                  throw error;
              }
              throw new InternalServerErrorException('Error al eliminar la actividad: ' + error.message);
          } finally {
              await queryRunner.release();
          }    }
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
