import { Injectable } from '@nestjs/common';
import { CreateAlmaceneDto } from './dto/create-almacene.dto';
import { UpdateAlmaceneDto } from './dto/update-almacene.dto';

@Injectable()
export class AlmacenesService {
  create(createAlmaceneDto: CreateAlmaceneDto) {
    return 'This action adds a new almacene';
  }

  findAll() {
    return `This action returns all almacenes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} almacene`;
  }

  update(id: number, updateAlmaceneDto: UpdateAlmaceneDto) {
    return `This action updates a #${id} almacene`;
  }

  remove(id: number) {
    return `This action removes a #${id} almacene`;
  }
}
