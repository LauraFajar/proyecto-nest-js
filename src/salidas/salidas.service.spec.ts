import { Test, TestingModule } from '@nestjs/testing';
import { SalidasService } from './salidas.service';

describe('SalidasService', () => {
  let service: SalidasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalidasService],
    }).compile();

    service = module.get<SalidasService>(SalidasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
