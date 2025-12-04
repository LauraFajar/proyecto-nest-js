import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/iot',
  transports: ['websocket', 'polling'],
})
export class IotGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private logger = new Logger('IotGateway');

  afterInit(server: Server) {
    this.logger.log(' IoT WebSocket Gateway initialized');
    this.logger.log(`WebSocket server running on namespace: /iot`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected to IoT WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected from IoT WebSocket: ${client.id}`);
  }

  // Emit new reading to all connected clients
  emitNewReading(reading: any) {
    this.logger.log(`EMITTING READING TO FRONTEND: ${JSON.stringify(reading)}`);
    
    try {
      this.server.emit('reading', reading);
      this.logger.log(` Reading successfully emitted to all connected clients`);
    } catch (error) {
      this.logger.error(' Error emitting reading to WebSocket clients:', error);
    }
  }

  // Emit broker status update
  emitBrokerStatus(brokerId: string, status: 'connected' | 'disconnected') {
    this.server.emit('brokerStatus', { brokerId, status });
  }

  // Emit sensor status update
  emitSensorStatus(deviceId: string, status: 'online' | 'offline') {
    this.server.emit('sensorStatus', { deviceId, status });
  }

  // Emit bulk reading update (for dashboard refresh)
  emitBulkReadings(readings: any[]) {
    this.server.emit('bulkReadings', readings);
  }

  // Emit dashboard data update
  emitDashboardUpdate(data: any) {
    this.server.emit('dashboardUpdate', data);
  }
}