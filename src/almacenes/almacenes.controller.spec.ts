import { Test, TestingModule } from '@nestjs/testing';
import { AlmacenesController } from './almacenes.controller';
import { AlmacenesService } from './almacenes.service';

describe('AlmacenesController', () => {
  let controller: AlmacenesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlmacenesController],
      providers: [AlmacenesService],
    }).compile();

    controller = module.get<AlmacenesController>(AlmacenesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
