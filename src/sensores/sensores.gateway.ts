import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

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
}
