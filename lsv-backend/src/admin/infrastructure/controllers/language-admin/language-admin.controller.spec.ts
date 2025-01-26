import { Test, TestingModule } from '@nestjs/testing';
import { LanguageAdminController } from './language-admin.controller';

describe('LanguageAdminController', () => {
  let controller: LanguageAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LanguageAdminController],
    }).compile();

    controller = module.get<LanguageAdminController>(LanguageAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
