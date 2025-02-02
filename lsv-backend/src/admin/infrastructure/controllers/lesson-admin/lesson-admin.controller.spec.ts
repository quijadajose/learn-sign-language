import { Test, TestingModule } from '@nestjs/testing';
import { LessonAdminController } from './lesson-admin.controller';

describe('LessonAdminController', () => {
  let controller: LessonAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonAdminController],
    }).compile();

    controller = module.get<LessonAdminController>(LessonAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
