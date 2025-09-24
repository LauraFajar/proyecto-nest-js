import { Test, TestingModule } from '@nestjs/testing';
import { SalidasController } from './salidas.controller';
import { SalidasService } from './salidas.service';

describe('SalidasController', () => {
  let controller: SalidasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalidasController],
      providers: [SalidasService],
    }).compile();

    controller = module.get<SalidasController>(SalidasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
