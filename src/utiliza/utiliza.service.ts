import { Injectable } from '@nestjs/common';
import { CreateUtilizaDto } from './dto/create-utiliza.dto';
import { UpdateUtilizaDto } from './dto/update-utiliza.dto';

@Injectable()
export class UtilizaService {
  create(createUtilizaDto: CreateUtilizaDto) {
    return 'This action adds a new utiliza';
  }

  findAll() {
    return `This action returns all utiliza`;
  }

  findOne(id: number) {
    return `This action returns a #${id} utiliza`;
  }

  update(id: number, updateUtilizaDto: UpdateUtilizaDto) {
    return `This action updates a #${id} utiliza`;
  }

  remove(id: number) {
    return `This action removes a #${id} utiliza`;
  }
}
