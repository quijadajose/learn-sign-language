import { BadRequestException, Inject, NotFoundException } from "@nestjs/common";
import { CreateLessonDto } from "../../dtos/create-lesson-dto/create-lesson-dto";
import { Lesson } from "src/shared/domain/entities/lesson";
import { StageRepositoryInterface } from "src/admin/domain/ports/stage.repository.interface/stage.repository.interface";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";
import { LessonRepositoryInterface } from "src/admin/domain/ports/lesson.repository.interface/lesson.repository.interface";

export class CreateLessonUseCase {
    constructor(
        @Inject('LanguageRepositoryInterface')
        private readonly languageRepository: LanguageRepositoryInterface,
        @Inject('StageRepositoryInterface')
        private readonly stageRepository: StageRepositoryInterface,
        @Inject('LessonRepositoryInterface')
        private readonly lessonRepository: LessonRepositoryInterface,
    ) { }
    async execute(createLessonDto: CreateLessonDto): Promise<Lesson> {
        const { name } = createLessonDto;

        const existingLesson = await this.lessonRepository.findByName(name);
        
        if (existingLesson) {
            throw new BadRequestException('Lesson already in use');
        }
        const stage = await this.stageRepository.findById(createLessonDto.stageId)
        if (!stage) {
            throw new NotFoundException('Stage not found');
        }

        const language = await this.languageRepository.findById(createLessonDto.languageId)
        if (!language) {
            throw new NotFoundException('Language not found');
        }

        const lesson = new Lesson();
        lesson.name = createLessonDto.name;
        lesson.description = createLessonDto.description;
        lesson.stage = stage
        lesson.language = language

        const createdLanguage = await this.lessonRepository.save(lesson);
        return createdLanguage;
    }
}
 