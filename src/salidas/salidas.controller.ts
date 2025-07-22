import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';

@Controller('salidas')
export class SalidasController {
  constructor(private readonly salidasService: SalidasService) {}

  @Post()
  create(@Body() createSalidaDto: CreateSalidaDto) {
    return this.salidasService.create(createSalidaDto);
  }

  @Get()
  findAll() {
    return this.salidasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salidasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalidaDto: UpdateSalidaDto) {
    return this.salidasService.update(+id, updateSalidaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salidasService.remove(+id);
  }
}
