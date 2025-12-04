import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { AlertSchedulerService } from './services/alert-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipAuthGuard } from '../auth/guards/skip-auth.guard';

@Controller('alertas')
@UseGuards(JwtAuthGuard)
export class AlertasController {
  constructor(
    private readonly alertasService: AlertasService,
    private readonly alertSchedulerService: AlertSchedulerService,
  ) {}

  @Post()
  create(@Body() createAlertaDto: any) {
    return this.alertasService.create(createAlertaDto);
  }

  @Get()
  findAll() {
    return this.alertasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertaDto: any) {
    return this.alertasService.update(+id, updateAlertaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertasService.remove(+id);
  }

  @Get('usuario/:id')
  obtenerNotificacionesUsuario(@Param('id') id: string) {
    return this.alertasService.obtenerNotificacionesUsuario(+id);
  }

  @Get('usuario/:id/no-leidas')
  obtenerNotificacionesNoLeidas(@Param('id') id: string) {
    return this.alertasService.obtenerNotificacionesUsuario(+id, true);
  }

  @Patch(':id/marcar-leida')
  marcarComoLeida(@Param('id') id: string) {
    return this.alertasService.marcarComoLeida(+id);
  }

  @Patch('usuario/:id/marcar-todas-leidas')
  marcarTodasComoLeidas(@Param('id') id: string) {
    return this.alertasService.marcarTodasComoLeidas(+id);
  }

  @Post(':id/enviar-email')
  enviarNotificacionEmail(
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    return this.alertasService.enviarNotificacionEmail(+id, email);
  }

  @Post('enviar-notificacion/:id')
  async enviarNotificacion(@Param('id') id: string, @Request() req) {
    return this.alertasService.enviarNotificacionEmail(+id, req.user.id);
  }

  @Post('test-alerts')
  async testAlerts() {
    return this.alertSchedulerService.testAlerts();
  }

  @UseGuards(SkipAuthGuard)
  @Post('test-alerts-public')
  async testAlertsPublic() {
    return this.alertSchedulerService.testAlerts();
  }

  @Post('notificar/sensor')
  notificarAlertaSensor(@Body() body: {
    id_usuario: number;
    sensor: string;
    valor: number;
    limite: number;
  }) {
    return this.alertasService.notificarAlertaSensor(
      body.id_usuario,
      body.sensor,
      body.valor,
      body.limite,
    );
  }

  @Post('notificar/stock-bajo')
  notificarStockBajo(@Body() body: {
    id_usuario: number;
    insumo: string;
    cantidad_actual: number;
    cantidad_minima: number;
  }) {
    return this.alertasService.notificarStockBajo(
      body.id_usuario,
      body.insumo,
      body.cantidad_actual,
      body.cantidad_minima,
    );
  }

  @Post('notificar/actividad-vencida')
  notificarActividadVencida(@Body() body: {
    id_usuario: number;
    actividad: string;
    fecha_vencimiento: string;
  }) {
    return this.alertasService.notificarActividadVencida(
      body.id_usuario,
      body.actividad,
      body.fecha_vencimiento,
    );
  }
}
