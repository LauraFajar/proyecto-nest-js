import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateActividadeDto } from './dto/create-actividade.dto';
import { UpdateActividadeDto } from './dto/update-actividade.dto';

@Controller('actividades')
@UseGuards(JwtAuthGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() createActividadDto: CreateActividadeDto) {
    return this.actividadesService.create(createActividadDto);
  }

  @Get()
  findAll(@Query('id_cultivo', new ParseIntPipe({ optional: true })) id_cultivo?: number) {
    return this.actividadesService.findAll(id_cultivo);
  }

  @Get('reporte')
  async reporteActividades(
    @Query('id_cultivo', new ParseIntPipe({ optional: true })) id_cultivo?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    return this.actividadesService.obtenerReporteActividades(
      id_cultivo,
      fecha_inicio,
      fecha_fin,
    );
  }

  @Get('estadisticas')
  async estadisticasActividades() {
    return this.actividadesService.obtenerEstadisticas();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateActividadDto: UpdateActividadeDto
  ) {
    return this.actividadesService.update(id, updateActividadDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.remove(id);
  }
}
