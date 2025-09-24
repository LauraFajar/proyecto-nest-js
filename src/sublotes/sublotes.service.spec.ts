import { Test, TestingModule } from '@nestjs/testing';
import { SublotesService } from './sublotes.service';

describe('SublotesService', () => {
  let service: SublotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SublotesService],
    }).compile();

    service = module.get<SublotesService>(SublotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
