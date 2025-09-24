import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SensoresService } from './sensores.service';

@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post()
  create(@Body() createSensorDto: any) {
    return this.sensoresService.create(createSensorDto);
  }

  @Get()
  findAll() {
    return this.sensoresService.findAll();
  }

  @Get('tiempo-real')
  obtenerDatosTiempoReal(@Query('sensor') id_sensor?: number) {
    return this.sensoresService.obtenerDatosTiempoReal(id_sensor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sensoresService.findOne(+id);
  }

  @Get(':id/historial')
  obtenerHistorial(
    @Param('id') id_sensor: number,
    @Query('limite') limite?: number
  ) {
    return this.sensoresService.obtenerHistorial(id_sensor, limite);
  }

  @Get(':id/recomendaciones')
  generarRecomendaciones(@Param('id') id_sensor: number) {
    return this.sensoresService.generarRecomendaciones(id_sensor);
  }

  @Post(':id/lectura')
  registrarLectura(
    @Param('id') id_sensor: number,
    @Body() body: { valor: number; unidad_medida?: string; observaciones?: string }
  ) {
    return this.sensoresService.registrarLectura(
      id_sensor,
      body.valor,
      body.unidad_medida,
      body.observaciones
    );
  }

  @Post(':id/configurar')
  configurarSensor(
    @Param('id') id_sensor: number,
    @Body() configuracion: {
      valor_minimo?: number;
      valor_maximo?: number;
      estado?: string;
      configuracion?: string;
    }
  ) {
    return this.sensoresService.configurarSensor(id_sensor, configuracion);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSensorDto: any) {
    return this.sensoresService.update(+id, updateSensorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sensoresService.remove(+id);
  }
}