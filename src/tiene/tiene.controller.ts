import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TieneService } from './tiene.service';
import { CreateTieneDto } from './dto/create-tiene.dto';
import { UpdateTieneDto } from './dto/update-tiene.dto';

@Controller('tiene')
export class TieneController {
  constructor(private readonly tieneService: TieneService) {}

  @Post()
  create(@Body() createTieneDto: CreateTieneDto) {
    return this.tieneService.create(createTieneDto);
  }

  @Get()
  findAll() {
    return this.tieneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tieneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTieneDto: UpdateTieneDto) {
    return this.tieneService.update(+id, updateTieneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tieneService.remove(+id);
  }
}
