import { Test, TestingModule } from '@nestjs/testing';
import { CultivosController } from './cultivos.controller';
import { CultivosService } from './cultivos.service';

describe('CultivosController', () => {
  let controller: CultivosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CultivosController],
      providers: [CultivosService],
    }).compile();

    controller = module.get<CultivosController>(CultivosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
