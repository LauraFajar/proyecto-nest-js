import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RealizaService } from './realiza.service';
import { CreateRealizaDto } from './dto/create-realiza.dto';
import { UpdateRealizaDto } from './dto/update-realiza.dto';

@Controller('realiza')
export class RealizaController {
  constructor(private readonly realizaService: RealizaService) {}

  @Post()
  create(@Body() createRealizaDto: CreateRealizaDto) {
    return this.realizaService.create(createRealizaDto);
  }

  @Get()
  findAll() {
    return this.realizaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realizaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRealizaDto: UpdateRealizaDto) {
    return this.realizaService.update(+id, updateRealizaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.realizaService.remove(+id);
  }
}
