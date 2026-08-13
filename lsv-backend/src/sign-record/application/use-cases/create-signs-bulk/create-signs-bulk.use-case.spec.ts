import { BadRequestException } from '@nestjs/common';
import { CreateSignsBulkUseCase } from './create-signs-bulk.use-case';
import type { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import type { Sign } from 'src/shared/domain/entities/sign';

describe('CreateSignsBulkUseCase', () => {
  const languageId = '11111111-1111-1111-1111-111111111111';
  const lessonId = '22222222-2222-2222-2222-222222222222';

  function makeRepo(existing: Partial<Sign>[] = []): SignRepositoryInterface {
    const saved: Sign[] = [];
    return {
      findById: jest.fn(),
      save: jest.fn(async (sign: Sign) => {
        const withId = { ...sign, id: `id-${saved.length + 1}` } as Sign;
        saved.push(withId);
        return withId;
      }),
      update: jest.fn(),
      remove: jest.fn(),
      findGlobalWithRecordingsCount: jest.fn(),
      findForLessonWithRecordingsCount: jest.fn(async () => existing as Sign[]),
      findForTraining: jest.fn(),
      create: jest.fn((data) => data as Sign),
    };
  }

  it('creates missing signs and skips duplicates already in lesson', async () => {
    const repo = makeRepo([{ name: 'A' } as Sign]);
    const useCase = new CreateSignsBulkUseCase(repo);

    const result = await useCase.execute({
      languageId,
      lessonId,
      signs: [
        { name: 'A', detectionType: 'static' },
        { name: 'B', detectionType: 'static' },
        { name: 'CH', detectionType: 'dynamic' },
      ],
    });

    expect(result.created).toHaveLength(2);
    expect(result.created.map((s) => s.name)).toEqual(['B', 'CH']);
    expect(result.skipped).toEqual([
      { name: 'A', reason: 'already_in_lesson' },
    ]);
  });

  it('skips duplicates inside the same request', async () => {
    const repo = makeRepo();
    const useCase = new CreateSignsBulkUseCase(repo);

    const result = await useCase.execute({
      languageId,
      lessonId,
      signs: [{ name: 'A' }, { name: 'a' }, { name: 'B' }],
    });

    expect(result.created).toHaveLength(2);
    expect(result.skipped).toEqual([
      { name: 'a', reason: 'duplicate_in_request' },
    ]);
  });

  it('requires lessonId', async () => {
    const repo = makeRepo();
    const useCase = new CreateSignsBulkUseCase(repo);

    await expect(
      useCase.execute({
        languageId,
        lessonId: '' as unknown as string,
        signs: [{ name: 'A' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
