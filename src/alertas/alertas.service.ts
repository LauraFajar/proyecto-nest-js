import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta } from './entities/alerta.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertasRepository: Repository<Alerta>,
    private readonly mailerService: MailerService,
  ) {}

  async create(createAlertaDto: any) {
    const nuevaAlerta = this.alertasRepository.create(createAlertaDto);
    return await this.alertasRepository.save(nuevaAlerta);
  }

  async findAll() {
    return await this.alertasRepository.find();
  }

  async findOne(id: number) {
    const alerta = await this.alertasRepository.findOne({ where: { id_alerta: id } });
    if (!alerta) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada.`);
    }
    return alerta;
  }

  async update(id: number, updateAlertaDto: any) {
    const alerta = await this.alertasRepository.findOne({ where: { id_alerta: id } });
    if (!alerta) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada.`);
    }
    await this.alertasRepository.update(id, updateAlertaDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const alerta = await this.alertasRepository.findOne({ where: { id_alerta: id } });
    if (!alerta) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada.`);
    }
    await this.alertasRepository.delete(id);
  }

  // Funcionalidades de notificaciones usando entidad Alerta existente
  async crearNotificacion(
    id_usuario: number,
    titulo: string,
    mensaje: string,
    tipo: string,
    datos_adicionales?: any,
  ): Promise<Alerta> {
    const alerta = this.alertasRepository.create({
      tipo_alerta: tipo,
      descripcion: mensaje,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      id_usuario,
      leida: false,
      enviada_email: false,
      datos_adicionales,
    });

    return await this.alertasRepository.save(alerta);
  }

  async obtenerNotificacionesUsuario(
    id_usuario: number,
    solo_no_leidas: boolean = false,
  ): Promise<Alerta[]> {
    const where: any = { id_usuario };
    if (solo_no_leidas) {
      where.leida = false;
    }

    return this.alertasRepository.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['id_sensor', 'usuario'],
    });
  }

  async marcarComoLeida(id_alerta: number): Promise<void> {
    await this.alertasRepository.update(id_alerta, { leida: true });
  }

  async marcarTodasComoLeidas(id_usuario: number): Promise<void> {
    await this.alertasRepository.update(
      { id_usuario, leida: false },
      { leida: true },
    );
  }

  async enviarNotificacionEmail(
    id_alerta: number,
    email: string,
  ): Promise<void> {
    const alerta = await this.findOne(id_alerta);

    await this.mailerService.sendMail({
      to: email,
      subject: alerta.tipo_alerta,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">${alerta.tipo_alerta}</h2>
          <p>${alerta.descripcion}</p>
          <p><strong>Fecha:</strong> ${alerta.fecha} ${alerta.hora}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            AgroTIC - Sistema de Trazabilidad de Cultivos
          </p>
        </div>
      `,
    });

    await this.alertasRepository.update(id_alerta, { enviada_email: true });
  }

  // Métodos específicos para diferentes tipos de notificaciones
  async notificarAlertaSensor(
    id_usuario: number,
    sensor: string,
    valor: number,
    limite: number,
  ): Promise<void> {
    await this.crearNotificacion(
      id_usuario,
      'Alerta de Sensor',
      `El sensor ${sensor} ha registrado un valor de ${valor}, que excede el límite de ${limite}`,
      'alerta',
      { sensor, valor, limite },
    );
  }

  async notificarStockBajo(
    id_usuario: number,
    insumo: string,
    cantidad_actual: number,
    cantidad_minima: number,
  ): Promise<void> {
    await this.crearNotificacion(
      id_usuario,
      'Stock Bajo',
      `El insumo "${insumo}" tiene stock bajo: ${cantidad_actual} unidades (mínimo: ${cantidad_minima})`,
      'stock_bajo',
      { insumo, cantidad_actual, cantidad_minima },
    );
  }

  async notificarActividadVencida(
    id_usuario: number,
    actividad: string,
    fecha_vencimiento: string,
  ): Promise<void> {
    await this.crearNotificacion(
      id_usuario,
      'Actividad Vencida',
      `La actividad "${actividad}" tenía fecha límite el ${fecha_vencimiento}`,
      'actividad_vencida',
      { actividad, fecha_vencimiento },
    );
  }
}
