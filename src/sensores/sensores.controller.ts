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

  @Get(':id/graficos')
  obtenerDatosGraficos(
    @Param('id') id_sensor: number,
    @Query('tipo') tipo?: 'linea' | 'barra' | 'area',
    @Query('periodo') periodo?: 'hora' | 'dia' | 'semana' | 'mes',
    @Query('limite') limite?: number
  ) {
    return this.sensoresService.obtenerDatosGraficos(id_sensor, tipo, periodo, limite);
  }

  @Get('cultivo/timeline')
  obtenerTimelineCultivo(
    @Query('id_sublote') id_sublote?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('sensores') sensores?: string // comma-separated sensor types
  ) {
    return this.sensoresService.obtenerTimelineCultivo(id_sublote, fecha_inicio, fecha_fin, sensores);
  }

  @Get('estadisticas/generales')
  obtenerEstadisticasGenerales(
    @Query('id_sublote') id_sublote?: number,
    @Query('tipo_sensor') tipo_sensor?: string
  ) {
    return this.sensoresService.obtenerEstadisticasGenerales(id_sublote, tipo_sensor);
  }

  @Post(':id/mqtt/configurar')
  configurarMqtt(
    @Param('id') id_sensor: number,
    @Body() config: {
      mqtt_host?: string;
      mqtt_port?: number;
      mqtt_topic?: string;
      mqtt_username?: string;
      mqtt_password?: string;
      mqtt_enabled?: boolean;
      mqtt_client_id?: string;
    }
  ) {
    return this.sensoresService.configurarMqtt(id_sensor, config);
  }

  @Get(':id/mqtt/estado')
  obtenerEstadoMqtt(@Param('id') id_sensor: number) {
    return this.sensoresService.obtenerEstadoMqtt(id_sensor);
  }

  @Post('mqtt/servidor/registrar')
  registrarServidorMqtt(@Body() servidor: {
    nombre: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    descripcion?: string;
  }) {
    return this.sensoresService.registrarServidorMqtt(servidor);
  }

  @Get('mqtt/servidores')
  obtenerServidoresMqtt() {
    return this.sensoresService.obtenerServidoresMqtt();
  }

  @Post('mqtt/servidor/:id_servidor/asignar-sensor/:id_sensor')
  asignarSensorAServidor(
    @Param('id_servidor') id_servidor: number,
    @Param('id_sensor') id_sensor: number,
    @Body() config: {
      topic: string;
      client_id?: string;
    }
  ) {
    return this.sensoresService.asignarSensorAServidor(id_servidor, id_sensor, config);
  }

  @Post('mqtt/servidor/:id_servidor/test-conexion')
  probarConexionServidor(@Param('id_servidor') id_servidor: number) {
    return this.sensoresService.probarConexionServidor(id_servidor);
  }
}