import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class IotGateway {
  private server: Server;

  constructor() {}

  setServer(server: Server) {
    this.server = server;
  }

  emitNewReading(reading: any): void {
    if (this.server) {
      this.server.emit('reading', reading);
    }
  }
}
