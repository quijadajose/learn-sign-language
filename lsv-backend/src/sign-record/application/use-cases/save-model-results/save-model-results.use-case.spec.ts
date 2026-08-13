import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';
import { SaveModelResultsUseCase } from './save-model-results.use-case';

describe('SaveModelResultsUseCase', () => {
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    supersedeReadyModels: jest.fn(),
  };
  const notification = {
    sendModelReady: jest.fn(),
  };

  const useCase = new SaveModelResultsUseCase(
    repo as unknown as LessonModelRepositoryInterface,
    notification as unknown as SignRecordNotificationPort,
  );

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('persists results and notifies on success', async () => {
    repo.findById.mockResolvedValue({
      id: 'model-1',
      modelType: 'static',
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1' },
      lessonVariant: { id: 'variant-1' },
    });

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
