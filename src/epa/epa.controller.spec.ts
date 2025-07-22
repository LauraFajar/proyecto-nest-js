import { Test, TestingModule } from '@nestjs/testing';
import { EpaController } from './epa.controller';
import { EpaService } from './epa.service';

describe('EpaController', () => {
  let controller: EpaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpaController],
      providers: [EpaService],
    }).compile();

    controller = module.get<EpaController>(EpaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
