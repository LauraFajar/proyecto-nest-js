import { Injectable } from '@nestjs/common';
import { CreateTieneDto } from './dto/create-tiene.dto';
import { UpdateTieneDto } from './dto/update-tiene.dto';

@Injectable()
export class TieneService {
  create(createTieneDto: CreateTieneDto) {
    return 'This action adds a new tiene';
  }

  findAll() {
    return `This action returns all tiene`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tiene`;
  }

  update(id: number, updateTieneDto: UpdateTieneDto) {
    return `This action updates a #${id} tiene`;
  }

  remove(id: number) {
    return `This action removes a #${id} tiene`;
  }
}
