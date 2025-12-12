import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MqttService } from './services/mqtt.service';

@WebSocketGateway({
  namespace: process.env.SOCKET_IO_NAMESPACE || '/iot',
  path: process.env.SOCKET_IO_PATH || '/socket.io',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SensoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('SensoresGateway');

  constructor(
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  emitLectura(sensorId: number, lectura: { valor: number; timestamp: string; unidad_medida?: string }) {
    this.server.emit('sensorLectura', { sensorId, ...lectura });
  }

  emitEstado(sensorId: number, online: boolean) {
    this.server.emit('sensorEstado', { sensorId, online });
  }

  emitBombaEstado(bomba: { estado: string; timestamp: string; sensorId?: number }) {
    this.server.emit('bombaEstado', bomba);
  }

  emitLecturaGeneric(topic: string, lectura: { valor: number; timestamp: string; tipo: string; unidad: string }) {
    this.server.emit('mqttLectura', { topic, ...lectura });
  }

  emitIotReading(reading: any) {
    this.server.emit('reading', reading);
  }

  emitControlCommandStatus(device: string, sensorName: string, action: 'ON' | 'OFF', status: 'success' | 'failure', message?: string) {
    this.server.emit('controlCommandStatus', { device, sensor: sensorName, action, status, message, timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('mqttControl')
  async handleMqttControl(@MessageBody() controlData: any) {
    this.logger.log(`📤 Recibido comando MQTT Control:`, controlData);
    
    try {
      const { topic, payload } = controlData;
      
      if (topic === 'luixxa/control' && payload) {
        const mqttTopic = `${topic}/${payload.device}`;
        const mqttMessage = JSON.stringify({
          sensor: payload.sensor,
          action: payload.action,
          timestamp: payload.timestamp
        });
        
        this.logger.log(`📤 Publicando en MQTT Topic: ${mqttTopic}, Message: ${mqttMessage}`);
        
        const published = this.mqttService.publishMessage(mqttTopic, mqttMessage);
        if (published) {
          this.logger.log(`✅ Comando MQTT enviado exitosamente`);
        } else {
          this.logger.warn(`⚠️ Cliente MQTT no disponible para enviar comando`);
        }
      } else {
        this.logger.warn(`⚠️ Formato de comando MQTT no válido:`, controlData);
      }
    } catch (error) {
      this.logger.error(`❌ Error procesando comando MQTT Control:`, error);
    }
  }
}
