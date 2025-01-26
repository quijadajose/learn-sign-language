import { Test, TestingModule } from '@nestjs/testing';
import { LanguageAdminService } from './language-admin.service';

describe('LanguageAdminService', () => {
  let service: LanguageAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LanguageAdminService],
    }).compile();

    service = module.get<LanguageAdminService>(LanguageAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
