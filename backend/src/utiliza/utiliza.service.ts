import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utiliza } from './entities/utiliza.entity';
import { CreateUtilizaDto } from './dto/create-utiliza.dto';
import { UpdateUtilizaDto } from './dto/update-utiliza.dto';
import { InventarioService } from '../inventario/inventario.service';
import { Insumo } from '../insumos/entities/insumo.entity';
import { Actividad } from '../actividades/entities/actividad.entity';

@Injectable()
export class UtilizaService {
  constructor(
    @InjectRepository(Utiliza)
    private utilizaRepository: Repository<Utiliza>,
    @InjectRepository(Insumo)
    private insumoRepository: Repository<Insumo>,
    @InjectRepository(Actividad)
    private actividadRepository: Repository<Actividad>,
    private inventarioService: InventarioService,
  ) {}

  async create(createUtilizaDto: CreateUtilizaDto) {
    const { id_actividades, id_insumo, cantidad, horas_uso } = createUtilizaDto;

    const actividad = await this.actividadRepository.findOne({
      where: { id_actividad: id_actividades },
    });
    if (!actividad) {
      throw new NotFoundException(
        `Actividad con ID ${id_actividades} no encontrada`,
      );
    }

    const insumo = await this.insumoRepository.findOne({
      where: { id_insumo: id_insumo },
    });
    if (!insumo) {
      throw new NotFoundException(`Insumo con ID ${id_insumo} no encontrado`);
    }

    if (insumo.es_herramienta) {
      const horasUso = parseFloat(horas_uso || '0');
      if (horasUso > 0) {
        const depreciacionPorHora = parseFloat(
          insumo.depreciacion_por_hora || '0',
        );
        const depreciacionAcumulada = parseFloat(
          insumo.depreciacion_acumulada || '0',
        );

        const nuevaDepreciacion =
          depreciacionAcumulada + horasUso * depreciacionPorHora;
        insumo.depreciacion_acumulada = nuevaDepreciacion.toString();
        await this.insumoRepository.save(insumo);
      }
    } else {
      const cantidadUtilizada = parseFloat(cantidad || '0');
      if (cantidadUtilizada > 0) {
        await this.inventarioService.reducirCantidad(
          insumo.id_insumo,
          cantidadUtilizada,
        );
      }
    }

    const nuevoRegistro = this.utilizaRepository.create({
      id_actividades: actividad,
      id_insumo: insumo,
      cantidad,
      horas_uso,
    });

    return await this.utilizaRepository.save(nuevoRegistro);
  }

  async findAll() {
    return await this.utilizaRepository.find();
  }

  async findOne(id_utiliza: number) {
    return await this.utilizaRepository.findOneBy({ id_utiliza });
  }

  async update(id_utiliza: number, updateUtilizaDto: UpdateUtilizaDto) {
    const toUpdate: any = { ...updateUtilizaDto };

    if (updateUtilizaDto.id_actividades) {
      const actividad = await this.actividadRepository.findOne({
        where: { id_actividad: updateUtilizaDto.id_actividades },
      });
      if (!actividad) {
        throw new NotFoundException(
          `Actividad con ID ${updateUtilizaDto.id_actividades} no encontrada`,
        );
      }
      toUpdate.id_actividades = actividad;
    }

    if (updateUtilizaDto.id_insumo) {
      const insumo = await this.insumoRepository.findOne({
        where: { id_insumo: updateUtilizaDto.id_insumo },
      });
      if (!insumo) {
        throw new NotFoundException(
          `Insumo con ID ${updateUtilizaDto.id_insumo} no encontrado`,
        );
      }
      toUpdate.id_insumo = insumo;
    }

    await this.utilizaRepository.update(id_utiliza, toUpdate);
    return this.findOne(id_utiliza);
  }

  async remove(id_utiliza: number) {
    return await this.utilizaRepository.delete(id_utiliza);
  }
}
