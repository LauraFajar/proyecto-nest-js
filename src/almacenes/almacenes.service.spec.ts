import { Test, TestingModule } from '@nestjs/testing';
import { AlmacenesService } from './almacenes.service';

describe('AlmacenesService', () => {
  let service: AlmacenesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlmacenesService],
    }).compile();

    service = module.get<AlmacenesService>(AlmacenesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
