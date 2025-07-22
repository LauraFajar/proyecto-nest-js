import { Test, TestingModule } from '@nestjs/testing';
import { TieneService } from './tiene.service';

describe('TieneService', () => {
  let service: TieneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TieneService],
    }).compile();

    service = module.get<TieneService>(TieneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
