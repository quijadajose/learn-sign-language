import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ImagesController } from './images.controller.js';
import { UploadPictureUseCase } from '../../../application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import { ResourceIdResolver } from '../../../../permissions/infrastructure/guards/resource-access/resource-id-resolver.js';

const ADMIN_REQ = { user: { sub: 'admin-id', role: 'admin' } };
const UPLOAD_ID = '99999999-9999-4999-8999-999999999999';

describe('ImagesController', () => {
  let controller: ImagesController;
  const uploadPictureUseCase = {
    execute: jest.fn().mockResolvedValue(['/images/user/id?size=original']),
  };
  const permissionRepository = {
    findByUserIdAndLanguageId: jest.fn().mockResolvedValue(null),
  };
  const resourceIdResolver = {
    resolveFromRelation: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        { provide: UploadPictureUseCase, useValue: uploadPictureUseCase },
        {
          provide: 'ModeratorPermissionRepositoryInterface',
          useValue: permissionRepository,
        },
        { provide: ResourceIdResolver, useValue: resourceIdResolver },
      ],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects disallowed upload folders', async () => {
    await expect(
      controller.uploadPicture(
        'evil',
        { buffer: Buffer.from('') } as Express.Multer.File,
        { id: 'x' },
        ADMIN_REQ,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uploadPictureUseCase.execute).not.toHaveBeenCalled();
  });

  it('uploads to allowlisted folders', async () => {
    const file = { buffer: Buffer.from('x') } as Express.Multer.File;
    await expect(
      controller.uploadPicture('user', file, { id: UPLOAD_ID }, ADMIN_REQ),
    ).resolves.toEqual(['/images/user/id?size=original']);
    expect(uploadPictureUseCase.execute).toHaveBeenCalledWith(
      UPLOAD_ID,
      'user',
      file,
    );
  });

  it("blocks a moderator from overwriting another user's avatar", async () => {
    const file = { buffer: Buffer.from('x') } as Express.Multer.File;
    await expect(
      controller.uploadPicture(
        'user',
        file,
        { id: '22222222-2222-4222-8222-222222222222' },
        {
          user: {
            sub: '11111111-1111-4111-8111-111111111111',
            role: 'moderator',
          },
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(uploadPictureUseCase.execute).not.toHaveBeenCalled();
  });

  it('lets a student upload their own avatar through the controller', async () => {
    const file = { buffer: Buffer.from('x') } as Express.Multer.File;
    await expect(
      controller.uploadPicture(
        'user',
        file,
        { id: UPLOAD_ID },
        { user: { sub: UPLOAD_ID, role: 'user' } },
      ),
    ).resolves.toEqual(['/images/user/id?size=original']);
  });

  it('rejects GET for folders outside the upload allowlist', () => {
    expect(() =>
      controller.getImage('etc', 'passwd', 'original', {} as never),
    ).toThrow(NotFoundException);
  });
});
