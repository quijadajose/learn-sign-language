import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { StageRepositoryInterface } from '../../../../stage/domain/ports/stage.repository.interface/stage.repository.interface.js';
import { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto.js';

export class CreateLessonUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  async execute(createLessonDto: CreateLessonDto): Promise<Lesson> {
    const { name, languageId, stageId, description, content } = createLessonDto;

    const existingLesson = await this.lessonRepository.findByNameInLanguage(
      name,
      languageId,
    );

    if (existingLesson) {
      throw new BadRequestException('errors.lesson.alreadyInUse');
    }

    const stage = await this.stageRepository.findById(stageId);
    if (!stage) {
      throw new NotFoundException('errors.stage.notFound');
    }
    // BE-06: la etapa debe pertenecer al mismo idioma que autorizó el guard.
    if (stage.language && stage.language.id !== languageId) {
      throw new BadRequestException('errors.lesson.stageLanguageMismatch');
    }

    const language = await this.languageRepository.findById(languageId);
    if (!language) {
      throw new NotFoundException('errors.language.notFound');
    }

    const lesson = new Lesson();
    lesson.name = name;
    lesson.description = description;
    lesson.stage = stage;
    lesson.language = language;
    lesson.content = content;

    const createdLesson = await this.lessonRepository.save(lesson);
    return createdLesson;
  }
}
