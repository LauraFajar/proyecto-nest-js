import { Test, TestingModule } from '@nestjs/testing';
import { RealizaService } from './realiza.service';

describe('RealizaService', () => {
  let service: RealizaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealizaService],
    }).compile();

    service = module.get<RealizaService>(RealizaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
