import { Test, TestingModule } from '@nestjs/testing';
import { StageAdminController } from './stage-admin.controller';

describe('StageAdminController', () => {
  let controller: StageAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StageAdminController],
    }).compile();

    controller = module.get<StageAdminController>(StageAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
