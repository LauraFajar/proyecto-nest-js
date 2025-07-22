import { Injectable } from '@nestjs/common';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';

@Injectable()
export class SalidasService {
  create(createSalidaDto: CreateSalidaDto) {
    return 'This action adds a new salida';
  }

  findAll() {
    return `This action returns all salidas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} salida`;
  }

  update(id: number, updateSalidaDto: UpdateSalidaDto) {
    return `This action updates a #${id} salida`;
  }

  remove(id: number) {
    return `This action removes a #${id} salida`;
  }
}
