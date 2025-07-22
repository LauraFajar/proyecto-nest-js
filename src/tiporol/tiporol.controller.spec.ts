import { Test, TestingModule } from '@nestjs/testing';
import { TiporolController } from './tiporol.controller';
import { TiporolService } from './tiporol.service';

describe('TiporolController', () => {
  let controller: TiporolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiporolController],
      providers: [TiporolService],
    }).compile();

    controller = module.get<TiporolController>(TiporolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
