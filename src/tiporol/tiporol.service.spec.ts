import { Test, TestingModule } from '@nestjs/testing';
import { TiporolService } from './tiporol.service';

describe('TiporolService', () => {
  let service: TiporolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiporolService],
    }).compile();

    service = module.get<TiporolService>(TiporolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
