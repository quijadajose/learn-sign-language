import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLesson } from '../../../../shared/domain/entities/userLesson.js';
import { StartLessonUseCase } from '../../use-cases/start-lesson-use-case/start-lesson-use-case.js';
import { SetLessonCompletionUseCase } from '../../use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case.js';
import { FindUserUseCase } from '../../../../auth/domain/use-cases/find-user/find-user.js';
import { GetLessonByIdUseCase } from '../../../../lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case.js';
import { GetRegionalLessonUseCase } from '../../../../lesson/application/use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case.js';

@Injectable()
export class UserLessonService {
  constructor(
    private readonly getUserLessonByUserIdUseCase: GetUserLessonByUserIdUseCase,
    private readonly startLessonUseCase: StartLessonUseCase,
    private readonly setLessonCompletionUseCase: SetLessonCompletionUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
    @Inject(GetRegionalLessonUseCase)
    private readonly getRegionalLessonUseCase: GetRegionalLessonUseCase,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  getUserLessonByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLesson>> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
  /** Alumnos solo pueden iniciar o completar lecciones de un idioma en el que estén inscritos. */
  private async assertEnrolledForLesson(userId: string, lessonId: string) {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }
    if (user.role === 'admin' || user.role === 'moderator') return;
    const rows = await this.dataSource.query(
      `SELECT ul."userId" FROM user_language ul
         WHERE ul."userId" = $1 AND ul."languageId" IN (
           SELECT l."languageId" FROM lesson l WHERE l.id = $2
           UNION ALL
           SELECT r."languageId" FROM lesson_variant lv
             JOIN region r ON r.id = lv."regionId" WHERE lv.id = $2
         ) LIMIT 1`,
      [userId, lessonId],
    );
    if (rows.length === 0) {
      throw new ForbiddenException('errors.lesson.notEnrolledInLanguage');
    }
  }

  async startLesson(userId: string, lessonId: string, regionId?: string) {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }
    await this.assertEnrolledForLesson(userId, lessonId);

    let baseLessonId = lessonId;

    try {
      const lessonOrVariant = await this.getRegionalLessonUseCase.execute(
        lessonId,
        regionId,
      );
      // Si es una variante (tiene la propiedad baseLesson), usar el ID de la lección base
      if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
        baseLessonId = lessonOrVariant.baseLesson.id;
      }
    } catch {
      throw new NotFoundException('errors.lesson.notFound');
    }

    // Usar siempre el ID de la lección base para user_lesson
    await this.startLessonUseCase.execute(userId, baseLessonId);
  }

  async setLessonCompletion(
    userId: string,
    lessonId: string,
    isCompleted: boolean,
  ) {
    await this.assertEnrolledForLesson(userId, lessonId);
    let baseLessonId = lessonId;

    try {
      const lessonOrVariant =
        await this.getRegionalLessonUseCase.execute(lessonId);
      // Si es una variante (tiene la propiedad baseLesson), usar el ID de la lección base
      if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
        baseLessonId = lessonOrVariant.baseLesson.id;
      }
    } catch {
      // Si no se encuentra como lección ni como variante, lanzamos 404
      throw new NotFoundException('errors.lesson.notFound');
    }

    await this.setLessonCompletionUseCase.execute(
      userId,
      baseLessonId,
      isCompleted,
    );
  }
}
