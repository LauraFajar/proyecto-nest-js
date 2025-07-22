import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UtilizaService } from './utiliza.service';
import { CreateUtilizaDto } from './dto/create-utiliza.dto';
import { UpdateUtilizaDto } from './dto/update-utiliza.dto';

@Controller('utiliza')
export class UtilizaController {
  constructor(private readonly utilizaService: UtilizaService) {}

  @Post()
  create(@Body() createUtilizaDto: CreateUtilizaDto) {
    return this.utilizaService.create(createUtilizaDto);
  }

  @Get()
  findAll() {
    return this.utilizaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.utilizaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUtilizaDto: UpdateUtilizaDto) {
    return this.utilizaService.update(+id, updateUtilizaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.utilizaService.remove(+id);
  }
}
