import { Injectable } from '@nestjs/common';
import { CreateTiporolDto } from './dto/create-tiporol.dto';
import { UpdateTiporolDto } from './dto/update-tiporol.dto';

@Injectable()
export class TiporolService {
  create(createTiporolDto: CreateTiporolDto) {
    return 'This action adds a new tiporol';
  }

  findAll() {
    return `This action returns all tiporol`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tiporol`;
  }

  update(id: number, updateTiporolDto: UpdateTiporolDto) {
    return `This action updates a #${id} tiporol`;
  }

  remove(id: number) {
    return `This action removes a #${id} tiporol`;
  }
}
