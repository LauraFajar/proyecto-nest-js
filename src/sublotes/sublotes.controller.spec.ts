import { Test, TestingModule } from '@nestjs/testing';
import { SublotesController } from './sublotes.controller';
import { SublotesService } from './sublotes.service';

describe('SublotesController', () => {
  let controller: SublotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SublotesController],
      providers: [SublotesService],
    }).compile();

    controller = module.get<SublotesController>(SublotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
