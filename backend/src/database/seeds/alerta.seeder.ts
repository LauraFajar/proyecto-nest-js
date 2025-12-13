import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Alerta } from 'src/alertas/entities/alerta.entity';
import { Sensor } from 'src/sensores/entities/sensor.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AlertaSeeder {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertaRepository: Repository<Alerta>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seed() {
    const data = [
      {
        tipo_alerta: 'Humedad Baja',
        descripcion: 'El nivel de humedad del suelo es criticamente bajo.',
        fecha: '2024-07-28',
        hora: '14:30:00',
        id_sensor: 1,
        id_usuario: 1,
      },
      {
        tipo_alerta: 'Temperatura Alta',
        descripcion: 'La temperatura del ambiente ha superado el umbral.',
        fecha: '2024-07-28',
        hora: '15:00:00',
        id_sensor: 2,
        id_usuario: 1,
      },
    ];

    for (const item of data) {
      const sensor = await this.sensorRepository.findOne({
        where: { id_sensor: item.id_sensor },
      });
      const usuario = await this.usuarioRepository.findOne({
        where: { id_usuarios: item.id_usuario },
      });
      if (sensor && usuario) {
        const exists = await this.alertaRepository.findOne({
          where: {
            tipo_alerta: item.tipo_alerta,
            fecha: item.fecha,
            sensor: { id_sensor: sensor.id_sensor },
            usuario: { id_usuarios: usuario.id_usuarios },
          },
        });
        if (!exists) {
          await this.alertaRepository.save(
            this.alertaRepository.create({ ...item, sensor, usuario }),
          );
        }
      }
    }
  }
}
