import { Injectable } from '@nestjs/common';
import { CreateSubloteDto } from './dto/create-sublote.dto';
import { UpdateSubloteDto } from './dto/update-sublote.dto';

@Injectable()
export class SublotesService {
  create(createSubloteDto: CreateSubloteDto) {
    return 'This action adds a new sublote';
  }

  findAll() {
    return `This action returns all sublotes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sublote`;
  }

  update(id: number, updateSubloteDto: UpdateSubloteDto) {
    return `This action updates a #${id} sublote`;
  }

  remove(id: number) {
    return `This action removes a #${id} sublote`;
  }
}
