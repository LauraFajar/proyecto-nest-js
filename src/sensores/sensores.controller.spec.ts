import { Test, TestingModule } from '@nestjs/testing';
import { SensoresController } from './sensores.controller';
import { SensoresService } from './sensores.service';

describe('SensoresController', () => {
  let controller: SensoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensoresController],
      providers: [SensoresService],
    }).compile();

    controller = module.get<SensoresController>(SensoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
