import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';
import {
  resolveSharedModelJsonPath,
  SaveModelResultsUseCase,
} from './save-model-results.use-case';

describe('SaveModelResultsUseCase', () => {
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    supersedeReadyModels: jest.fn(),
  };
  const notification = {
    sendModelReady: jest.fn(),
  };
  const fileStorage = {
    getSharedDir: jest.fn().mockReturnValue('/data/shared'),
    sharedPath: jest
      .fn()
      .mockImplementation((...segs: string[]) =>
        ['/data/shared', ...segs].join('/'),
      ),
    sha256File: jest.fn(),
  };

  const useCase = new SaveModelResultsUseCase(
    repo as unknown as LessonModelRepositoryInterface,
    notification as unknown as SignRecordNotificationPort,
    fileStorage as unknown as FileStoragePort,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    fileStorage.getSharedDir.mockReturnValue('/data/shared');
    fileStorage.sharedPath.mockImplementation((...segs: string[]) =>
      ['/data/shared', ...segs].join('/'),
    );
  });

  const validPayload = {
    modelJsonUrl: '/shared/models/m1/model.json',
    binUrls: ['group1-shard1of1.bin'],
    accuracy: 0.91,
    labels: ['hola', 'adios'],
    logs: { loss: [0.1] },
    modelType: 'static',
    featuresCount: 202,
    featuresSchemaVersion: 'static-v2',
    modelJsonSha256: 'a'.repeat(64),
  };

  it('rejects invalid trainer payloads', async () => {
    await expect(
      useCase.execute('model-id', { accuracy: 0.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('throws when model is missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', validPayload),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a hash mismatch', async () => {
    repo.findById.mockResolvedValue({
      id: 'model-1',
      modelType: 'static',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      lessonVariant: { id: 'variant-1' },
    });
    fileStorage.sha256File.mockResolvedValue('b'.repeat(64));
    await expect(
      useCase.execute('model-1', validPayload),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('persists results and notifies on success', async () => {
    repo.findById.mockResolvedValue({
      id: 'model-1',
      modelType: 'static',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      lessonVariant: { id: 'variant-1' },
    });
    fileStorage.sha256File.mockResolvedValue('a'.repeat(64));

    await expect(useCase.execute('model-1', validPayload)).resolves.toEqual({
      success: true,
    });

    expect(repo.update).toHaveBeenCalledWith(
      'model-1',
      expect.objectContaining({
        status: 'READY',
        modelJsonUrl: validPayload.modelJsonUrl,
        accuracy: 0.91,
        labels: validPayload.labels,
      }),
    );
    expect(repo.supersedeReadyModels).toHaveBeenCalled();
    expect(notification.sendModelReady).toHaveBeenCalledWith(
      'model-1',
      expect.objectContaining({ modelJsonUrl: validPayload.modelJsonUrl }),
    );
  });
});

describe('resolveSharedModelJsonPath', () => {
  const storage = {
    getSharedDir: () => '/data/shared',
    sharedPath: (...segs: string[]) => ['/data/shared', ...segs].join('/'),
  } as unknown as FileStoragePort;

  it('maps /shared/models/.../model.json', () => {
    expect(
      resolveSharedModelJsonPath('/shared/models/m1/model.json', storage),
    ).toBe('/data/shared/models/m1/model.json');
  });

  it('rejects path traversal', () => {
    expect(
      resolveSharedModelJsonPath('/shared/models/../etc/model.json', storage),
    ).toBeNull();
  });
});
