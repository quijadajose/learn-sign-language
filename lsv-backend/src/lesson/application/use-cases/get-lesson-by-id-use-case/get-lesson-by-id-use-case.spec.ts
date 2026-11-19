import { NotFoundException } from '@nestjs/common';
import { GetLessonByIdUseCase } from './get-lesson-by-id-use-case.js';

describe('GetLessonByIdUseCase (AF-F6-03)', () => {
  it('returns the lesson when it exists', async () => {
    const lesson = { id: 'l1', name: 'Alfabeto' };
    const useCase = new GetLessonByIdUseCase({
      findById: jest.fn(async () => lesson),
    } as never);
    await expect(useCase.execute('l1')).resolves.toBe(lesson);
  });

  it('throws 404 instead of returning an empty 200 when the lesson is missing', async () => {
    const useCase = new GetLessonByIdUseCase({
      findById: jest.fn(async () => null),
    } as never);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
