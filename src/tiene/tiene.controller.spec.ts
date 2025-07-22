import { Test, TestingModule } from '@nestjs/testing';
import { TieneController } from './tiene.controller';
import { TieneService } from './tiene.service';

describe('TieneController', () => {
  let controller: TieneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TieneController],
      providers: [TieneService],
    }).compile();

    controller = module.get<TieneController>(TieneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
