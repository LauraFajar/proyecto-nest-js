import { Injectable } from '@nestjs/common';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Injectable()
export class CultivosService {
  create(createCultivoDto: CreateCultivoDto) {
    return 'This action adds a new cultivo';
  }

  findAll() {
    return `This action returns all cultivos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cultivo`;
  }

  update(id: number, updateCultivoDto: UpdateCultivoDto) {
    return `This action updates a #${id} cultivo`;
  }

  remove(id: number) {
    return `This action removes a #${id} cultivo`;
  }
}
