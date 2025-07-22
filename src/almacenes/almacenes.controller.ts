import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AlmacenesService } from './almacenes.service';
import { CreateAlmaceneDto } from './dto/create-almacene.dto';
import { UpdateAlmaceneDto } from './dto/update-almacene.dto';

@Controller('almacenes')
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @Post()
  create(@Body() createAlmaceneDto: CreateAlmaceneDto) {
    return this.almacenesService.create(createAlmaceneDto);
  }

  @Get()
  findAll() {
    return this.almacenesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.almacenesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlmaceneDto: UpdateAlmaceneDto) {
    return this.almacenesService.update(+id, updateAlmaceneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.almacenesService.remove(+id);
  }
}
