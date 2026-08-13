import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';

describe('ImagesController', () => {
  let controller: ImagesController;
  const uploadPictureUseCase = {
    execute: jest.fn().mockResolvedValue(['/images/user/id?size=original']),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        { provide: UploadPictureUseCase, useValue: uploadPictureUseCase },
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
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uploadPictureUseCase.execute).not.toHaveBeenCalled();
  });

  it('uploads to allowlisted folders', async () => {
    const file = { buffer: Buffer.from('x') } as Express.Multer.File;
    await expect(
      controller.uploadPicture('user', file, { id: 'id-1' }),
    ).resolves.toEqual(['/images/user/id?size=original']);
    expect(uploadPictureUseCase.execute).toHaveBeenCalledWith(
      'id-1',
      'user',
      file,
    );
  });
});
