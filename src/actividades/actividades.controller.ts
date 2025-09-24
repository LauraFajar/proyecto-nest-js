import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('actividades')
@UseGuards(JwtAuthGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  create(@Body() createActividadDto: any) {
    return this.actividadesService.create(createActividadDto);
  }

  @Get()
  findAll() {
    return this.actividadesService.findAll();
  }

  @Get('reporte')
  async reporteActividades(
    @Query('id_cultivo') id_cultivo?: number,
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
  findOne(@Param('id') id: string) {
    return this.actividadesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActividadDto: any) {
    return this.actividadesService.update(+id, updateActividadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actividadesService.remove(+id);
  }
}
