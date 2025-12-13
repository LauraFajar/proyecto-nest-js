import { Controller, Post } from '@nestjs/common';
import { AlertSchedulerService } from './services/alert-scheduler.service';

@Controller('test')
export class TestController {
  constructor(
    private readonly alertSchedulerService: AlertSchedulerService,
  ) {}

  @Post('alerts')
  async testAlerts() {
    return this.alertSchedulerService.testAlerts();
  }
}