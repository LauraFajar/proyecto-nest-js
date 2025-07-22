import { Injectable } from '@nestjs/common';
import { CreateRealizaDto } from './dto/create-realiza.dto';
import { UpdateRealizaDto } from './dto/update-realiza.dto';

@Injectable()
export class RealizaService {
  create(createRealizaDto: CreateRealizaDto) {
    return 'This action adds a new realiza';
  }

  findAll() {
    return `This action returns all realiza`;
  }

  findOne(id: number) {
    return `This action returns a #${id} realiza`;
  }

  update(id: number, updateRealizaDto: UpdateRealizaDto) {
    return `This action updates a #${id} realiza`;
  }

  remove(id: number) {
    return `This action removes a #${id} realiza`;
  }
}
