import { Test, TestingModule } from '@nestjs/testing';
import { UtilizaService } from './utiliza.service';

describe('UtilizaService', () => {
  let service: UtilizaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilizaService],
    }).compile();

    service = module.get<UtilizaService>(UtilizaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
