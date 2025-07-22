import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TiporolService } from './tiporol.service';
import { CreateTiporolDto } from './dto/create-tiporol.dto';
import { UpdateTiporolDto } from './dto/update-tiporol.dto';

@Controller('tiporol')
export class TiporolController {
  constructor(private readonly tiporolService: TiporolService) {}

  @Post()
  create(@Body() createTiporolDto: CreateTiporolDto) {
    return this.tiporolService.create(createTiporolDto);
  }

  @Get()
  findAll() {
    return this.tiporolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiporolService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTiporolDto: UpdateTiporolDto) {
    return this.tiporolService.update(+id, updateTiporolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiporolService.remove(+id);
  }
}
