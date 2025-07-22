import { Test, TestingModule } from '@nestjs/testing';
import { TratamientosController } from './tratamientos.controller';
import { TratamientosService } from './tratamientos.service';

describe('TratamientosController', () => {
  let controller: TratamientosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TratamientosController],
      providers: [TratamientosService],
    }).compile();

    controller = module.get<TratamientosController>(TratamientosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
