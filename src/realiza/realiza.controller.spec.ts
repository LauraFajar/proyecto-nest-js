import { Test, TestingModule } from '@nestjs/testing';
import { RealizaController } from './realiza.controller';
import { RealizaService } from './realiza.service';

describe('RealizaController', () => {
  let controller: RealizaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealizaController],
      providers: [RealizaService],
    }).compile();

    controller = module.get<RealizaController>(RealizaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
