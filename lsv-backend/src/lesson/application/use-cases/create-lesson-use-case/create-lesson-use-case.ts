import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto';

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
      throw new BadRequestException('Lesson already in use');
    }

    const stage = await this.stageRepository.findById(stageId);
    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const language = await this.languageRepository.findById(languageId);
    if (!language) {
      throw new NotFoundException('Language not found');
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
