import { Test, TestingModule } from '@nestjs/testing';
import { StageAdminService } from './stage-admin.service';

describe('StageAdminService', () => {
  let service: StageAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StageAdminService],
    }).compile();

    service = module.get<StageAdminService>(StageAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
