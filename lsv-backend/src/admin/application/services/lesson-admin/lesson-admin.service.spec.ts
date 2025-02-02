import { Test, TestingModule } from '@nestjs/testing';
import { LessonAdminService } from './lesson-admin.service';

describe('LessonAdminService', () => {
  let service: LessonAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonAdminService],
    }).compile();

    service = module.get<LessonAdminService>(LessonAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
