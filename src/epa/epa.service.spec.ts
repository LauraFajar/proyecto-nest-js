import { Test, TestingModule } from '@nestjs/testing';
import { EpaService } from './epa.service';

describe('EpaService', () => {
  let service: EpaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpaService],
    }).compile();

    service = module.get<EpaService>(EpaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
