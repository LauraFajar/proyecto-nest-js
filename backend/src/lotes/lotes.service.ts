import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lote } from './entities/lote.entity';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
@Injectable()
export class LotesService {
  constructor(
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async create(createLoteDto: CreateLoteDto): Promise<Lote> {
    const { coordenadas, ...loteData } = createLoteDto;

    const lote = this.loteRepository.create({
      ...loteData,
      coordenadas: coordenadas
        ? {
            type: 'Polygon',
            coordinates: coordenadas,
          }
        : undefined,
    });

    return this.loteRepository.save(lote);
  }

  async findAll() {
    return this.loteRepository.find();
  }

  async findOne(id_lote: number) {
    const lote = await this.loteRepository.findOneBy({ id_lote });
    if (!lote) {
      throw new NotFoundException(`Lote con ID ${id_lote} no encontrado`);
    }
    return lote;
  }

  async update(id_lote: number, updateLoteDto: UpdateLoteDto): Promise<Lote> {
    const lote = await this.findOne(id_lote);

    const { coordenadas, ...loteData } = updateLoteDto;

    Object.assign(lote, loteData);

    if (Object.prototype.hasOwnProperty.call(updateLoteDto, 'coordenadas')) {
      const c: any = coordenadas as any;
      const isEmpty = Array.isArray(c) ? c.length === 0 : c == null;
      if (isEmpty) {
        (lote as any).coordenadas = null;
      } else {
        (lote as any).coordenadas = { type: 'Polygon', coordinates: c };
      }
    }

    return this.loteRepository.save(lote);
  }

  async remove(id_lote: number) {
    return this.loteRepository.delete(id_lote);
  }

  async findAllWithGeoData(): Promise<Lote[]> {
    return this.loteRepository
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.sublotes', 'sublote')
      .select([
        'lote.id_lote',
        'lote.nombre_lote',
        'lote.descripcion',
        'lote.activo',
        'lote.coordenadas',
        'sublote.id_sublote',
        'sublote.descripcion',
        'sublote.ubicacion',
        'sublote.coordenadas',
      ])
      .getMany();
  }
}
