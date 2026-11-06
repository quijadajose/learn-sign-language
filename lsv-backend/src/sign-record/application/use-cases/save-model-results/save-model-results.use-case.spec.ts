import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { SignRecordNotificationPort } from '../../../domain/ports/sign-record.notification.port.js';
import { FileStoragePort } from '../../../domain/ports/file-storage.port.js';
import {
  normalizeModelJsonUrl,
  resolveSharedModelJsonPath,
  SaveModelResultsUseCase,
} from './save-model-results.use-case.js';

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
    binSha256: { 'group1-shard1of1.bin': 'c'.repeat(64) },
  };

  const existingModel = {
    id: 'model-1',
    modelType: 'static',
    lessonId: 'lesson-1',
    lesson: { id: 'lesson-1' },
    lessonVariant: { id: 'variant-1' },
  };

  /** Hash según el archivo: model.json → 'a', el shard → 'c'. */
  const hashesByFile = (bin = 'c'.repeat(64)) =>
    fileStorage.sha256File.mockImplementation((file: string) =>
      Promise.resolve(file.endsWith('model.json') ? 'a'.repeat(64) : bin),
    );

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

  it('rejects a weight shard whose hash does not match', async () => {
    repo.findById.mockResolvedValue(existingModel);
    hashesByFile('d'.repeat(64));
    await expect(
      useCase.execute('model-1', validPayload),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fileStorage.sha256File).toHaveBeenCalledWith(
      '/data/shared/models/m1/group1-shard1of1.bin',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects shards without a declared hash', async () => {
    repo.findById.mockResolvedValue(existingModel);
    hashesByFile();
    await expect(
      useCase.execute('model-1', {
        ...validPayload,
        binUrls: ['group1-shard1of1.bin', 'group1-shard2of2.bin'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute('model-1', { ...validPayload, binSha256: undefined }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects shard names that escape the model directory', async () => {
    repo.findById.mockResolvedValue(existingModel);
    hashesByFile();
    await expect(
      useCase.execute('model-1', {
        ...validPayload,
        binUrls: ['../other/model.bin'],
        binSha256: { '../other/model.bin': 'c'.repeat(64) },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fileStorage.sha256File).not.toHaveBeenCalledWith(
      expect.stringContaining('other'),
    );
  });

  it('persists results and notifies on success', async () => {
    repo.findById.mockResolvedValue({
      id: 'model-1',
      modelType: 'static',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      lessonVariant: { id: 'variant-1' },
    });
    hashesByFile();

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

  it('accepts the relative form reported by the trainer (TR-05)', () => {
    expect(resolveSharedModelJsonPath('models/m1/model.json', storage)).toBe(
      '/data/shared/models/m1/model.json',
    );
  });

  it('rejects relative traversal', () => {
    expect(
      resolveSharedModelJsonPath('models/../etc/model.json', storage),
    ).toBeNull();
  });
});

describe('normalizeModelJsonUrl', () => {
  it('canonicalizes the relative trainer path to /shared/models', () => {
    expect(normalizeModelJsonUrl('models/m1/model.json')).toBe(
      '/shared/models/m1/model.json',
    );
  });

  it('keeps the absolute /shared form unchanged', () => {
    expect(normalizeModelJsonUrl('/shared/models/m1/model.json')).toBe(
      '/shared/models/m1/model.json',
    );
  });

  it('extracts the pathname from an http(s) URL', () => {
    expect(
      normalizeModelJsonUrl('http://backend:3000/shared/models/m1/model.json'),
    ).toBe('/shared/models/m1/model.json');
  });

  it('rejects paths outside models/ and backslashes', () => {
    expect(normalizeModelJsonUrl('/etc/model.json')).toBeNull();
    expect(normalizeModelJsonUrl('models\\m1\\model.json')).toBeNull();
    expect(normalizeModelJsonUrl('models/m1/weights.bin')).toBeNull();
  });
});
