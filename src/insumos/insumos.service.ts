import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insumo } from './entities/insumo.entity';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Almacen } from '../almacenes/entities/almacen.entity';

@Injectable()
export class InsumosService {
  constructor(
    @InjectRepository(Insumo)
    private insumosRepository: Repository<Insumo>,
    @InjectRepository(Categoria)
    private categoriasRepository: Repository<Categoria>,
    @InjectRepository(Almacen)
    private almacenesRepository: Repository<Almacen>,
  ) {}

  async create(createInsumoDto: CreateInsumoDto) {
    const { id_categoria, id_almacen, ...rest } = createInsumoDto;

    let categoriaEntity: Categoria | undefined;
    let almacenEntity: Almacen | undefined;

    if (id_categoria !== undefined) {
      const categoria = await this.categoriasRepository.findOne({ where: { id_categoria } });
      if (!categoria) {
        throw new NotFoundException(`Categoria con ID ${id_categoria} no encontrada`);
      }
      categoriaEntity = categoria;
    }

    if (id_almacen !== undefined) {
      const almacen = await this.almacenesRepository.findOne({ where: { id_almacen } });
      if (!almacen) {
        throw new NotFoundException(`Almacen con ID ${id_almacen} no encontrado`);
      }
      almacenEntity = almacen;
    }

    const nuevoInsumo = this.insumosRepository.create({
      ...rest,
      ...(categoriaEntity && { id_categoria: categoriaEntity }),
      ...(almacenEntity && { id_almacen: almacenEntity }),
    });

    const guardado = await this.insumosRepository.save(nuevoInsumo);
    return await this.findOne(guardado.id_insumo);
  }

  async findAll() {
    return await this.insumosRepository.find({
      relations: ['id_categoria', 'id_almacen'],
    });
  }

  async findOne(id_insumo: number) {
    return await this.insumosRepository.findOne({
      where: { id_insumo },
      relations: ['id_categoria', 'id_almacen'],
    });
  }

  async update(id_insumo: number, updateInsumoDto: UpdateInsumoDto) {
    const { id_categoria, id_almacen, ...rest } = updateInsumoDto;

    const updateData: Partial<Insumo> = { ...rest } as Partial<Insumo>;

    if (id_categoria !== undefined) {
      const categoria = await this.categoriasRepository.findOne({ where: { id_categoria } });
      if (!categoria) {
        throw new NotFoundException(`Categoria con ID ${id_categoria} no encontrada`);
      }
      updateData.id_categoria = categoria;
    }

    if (id_almacen !== undefined) {
      const almacen = await this.almacenesRepository.findOne({ where: { id_almacen } });
      if (!almacen) {
        throw new NotFoundException(`Almacen con ID ${id_almacen} no encontrado`);
      }
      updateData.id_almacen = almacen;
    }

    await this.insumosRepository.update(id_insumo, updateData as any);
    return this.findOne(id_insumo); 
  }

  async remove(id_insumo: number) {
    return await this.insumosRepository.delete(id_insumo);
  }
}
