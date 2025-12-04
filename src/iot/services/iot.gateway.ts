import { Injectable } from '@nestjs/common';

@Injectable()
export class IotGateway {
  emitNewReading(_reading: any): void {}
}
