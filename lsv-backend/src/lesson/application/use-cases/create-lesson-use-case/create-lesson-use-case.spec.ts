import { BadRequestException } from '@nestjs/common';
import { CreateLessonUseCase } from './create-lesson-use-case.js';
import type { StageRepositoryInterface } from '../../../../stage/domain/ports/stage.repository.interface/stage.repository.interface.js';
import type { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import type { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import type { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto.js';

describe('CreateLessonUseCase (BE-06)', () => {
  const languageId = 'lang-a';
  const dto = {
    name: 'Lección',
    description: 'd',
    content: 'c',
    languageId,
    stageId: 'stage-1',
  } as CreateLessonDto;

  function build(stage: unknown) {
    const lessonRepository = {
      findByNameInLanguage: jest.fn().mockResolvedValue(null),
      save: jest.fn((lesson: unknown) => Promise.resolve(lesson)),
    };
    const useCase = new CreateLessonUseCase(
      {
        findById: jest.fn().mockResolvedValue({ id: languageId }),
      } as unknown as LanguageRepositoryInterface,
      {
        findById: jest.fn().mockResolvedValue(stage),
      } as unknown as StageRepositoryInterface,
      lessonRepository as unknown as LessonRepositoryInterface,
    );
    return { useCase, lessonRepository };
  }

  it('creates the lesson when the stage belongs to the same language', async () => {
    const { useCase, lessonRepository } = build({
      id: 'stage-1',
      language: { id: languageId },
    });
    await expect(useCase.execute(dto)).resolves.toBeDefined();
    expect(lessonRepository.save).toHaveBeenCalled();
  });

  it('rejects a stage of another language', async () => {
    const { useCase, lessonRepository } = build({
      id: 'stage-1',
      language: { id: 'lang-b' },
    });
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(lessonRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a stage without a language (fail-closed)', async () => {
    const { useCase, lessonRepository } = build({ id: 'stage-1' });
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(lessonRepository.save).not.toHaveBeenCalled();
  });
});
