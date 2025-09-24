import { Test, TestingModule } from '@nestjs/testing';
import { UtilizaController } from './utiliza.controller';
import { UtilizaService } from './utiliza.service';

describe('UtilizaController', () => {
  let controller: UtilizaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilizaController],
      providers: [UtilizaService],
    }).compile();

    controller = module.get<UtilizaController>(UtilizaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
