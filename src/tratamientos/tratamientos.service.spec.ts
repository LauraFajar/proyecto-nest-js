import { Test, TestingModule } from '@nestjs/testing';
import { TratamientosService } from './tratamientos.service';

describe('TratamientosService', () => {
  let service: TratamientosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TratamientosService],
    }).compile();

    service = module.get<TratamientosService>(TratamientosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
