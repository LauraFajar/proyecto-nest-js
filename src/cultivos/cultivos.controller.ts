import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards,HttpCode,HttpStatus, Query} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { CultivosService } from './cultivos.service';
import { CreateCultivoDto } from './dto/create-cultivo.dto';
import { UpdateCultivoDto } from './dto/update-cultivo.dto';

@Controller('cultivos')
@UseGuards(AuthGuard('jwt'))
export class CultivosController {
  constructor(private readonly cultivosService: CultivosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCultivoDto: CreateCultivoDto) {
    return this.cultivosService.create(createCultivoDto);
  }

  @Get()
  findAll() {
    return this.cultivosService.findAll();
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.cultivosService.getEstadisticas();
  }

  @Get('calendario')
  getCalendario(
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.cultivosService.getCalendario(fecha_desde, fecha_hasta);
  }
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateCultivoDto: UpdateCultivoDto
  ) {
    return this.cultivosService.update(id, updateCultivoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cultivosService.remove(id);
  }
}
