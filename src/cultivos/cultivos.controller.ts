import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CultivosService } from './cultivos.service';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Controller('cultivos')
export class CultivosController {
  constructor(private readonly cultivosService: CultivosService) {}

  @Post()
  create(@Body() createCultivoDto: CreateCultivoDto) {
    return this.cultivosService.create(createCultivoDto);
  }

  @Get()
  findAll() {
    return this.cultivosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cultivosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCultivoDto: UpdateCultivoDto) {
    return this.cultivosService.update(+id, updateCultivoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cultivosService.remove(+id);
  }
}
