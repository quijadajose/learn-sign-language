import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourcePermissionSource } from '../../interfaces/resource-permission-metadata.interface.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { Region } from '../../../../shared/domain/entities/region.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { QuizVariant } from '../../../../shared/domain/entities/quizVariant.js';
import { Sign } from '../../../../shared/domain/entities/sign.js';
import { LessonModel } from '../../../../shared/domain/entities/lessonModel.js';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';

@Injectable()
export class ResourceIdResolver {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    @InjectRepository(Stages)
    private readonly stageRepository: Repository<Stages>,
    @InjectRepository(LessonVariant)
    private readonly lessonVariantRepository: Repository<LessonVariant>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizVariant)
    private readonly quizVariantRepository: Repository<QuizVariant>,
    @InjectRepository(Sign)
    private readonly signRepository: Repository<Sign>,
    @InjectRepository(LessonModel)
    private readonly lessonModelRepository: Repository<LessonModel>,
    @InjectRepository(SignRecording)
    private readonly signRecordingRepository: Repository<SignRecording>,
  ) {}

  async resolveResourceId(
    source: ResourcePermissionSource,
    params: Record<string, unknown>,
    body: Record<string, unknown> | null | undefined,
    query: Record<string, unknown>,
  ): Promise<string | null> {
    let resourceId: string | null = null;

    if (
      source.param &&
      params[source.param] != null &&
      params[source.param] !== ''
    ) {
      resourceId = String(params[source.param]);
    } else if (
      source.body &&
      body &&
      body[source.body] != null &&
      body[source.body] !== ''
    ) {
      resourceId = String(body[source.body]);
    } else if (
      source.query &&
      query[source.query] != null &&
      query[source.query] !== ''
    ) {
      const value = query[source.query];
      resourceId = Array.isArray(value) ? String(value[0]) : String(value);
    }

    if (!resourceId) {
      return null;
    }

    if (source.resolve) {
      return await this.resolveFromRelation(source.resolve, resourceId);
    }

    return resourceId;
  }

  async resolveFromRelation(
    resolvePath: string,
    resourceId: string,
  ): Promise<string> {
    const parts = resolvePath.split('.');

    if (parts.length === 2) {
      const [entityName, property] = parts;

      switch (entityName) {
        case 'lesson': {
          const lesson = await this.lessonRepository.findOne({
            where: { id: resourceId },
            relations: {
              language: true,
            },
          });
          if (!lesson) {
            throw new NotFoundException('errors.lesson.notFound');
          }
          return lesson.language?.id || null;
        }

        case 'quiz': {
          const quiz = await this.quizRepository.findOne({
            where: { id: resourceId },
            relations: {
              lesson: {
                language: true,
              },
            },
          });
          if (!quiz) {
            throw new NotFoundException('errors.quiz.notFound');
          }
          return quiz.lesson?.language?.id || null;
        }

        case 'stage': {
          const stage = await this.stageRepository.findOne({
            where: { id: resourceId },
            relations: {
              language: true,
            },
          });
          if (!stage) {
            throw new NotFoundException('errors.stage.notFound');
          }
          return stage.language?.id || null;
        }

        case 'region': {
          const region = await this.regionRepository.findOne({
            where: { id: resourceId },
            relations: {
              language: true,
            },
          });
          if (!region) {
            throw new NotFoundException('errors.region.notFound');
          }
          if (property === 'languageId') {
            return region.language?.id || null;
          }
          return region[property] || null;
        }

        case 'variant': {
          const variant = await this.lessonVariantRepository.findOne({
            where: { id: resourceId },
            relations: {
              region: true,
            },
          });
          if (!variant) {
            throw new NotFoundException('errors.lesson.variantNotFound');
          }
          return variant.region?.id || null;
        }

        case 'sign': {
          const sign = await this.signRepository.findOne({
            where: { id: resourceId },
            relations: {
              language: true,

              lessons: {
                language: true,
              },
            },
          });
          if (!sign) {
            throw new NotFoundException('errors.sign.notFound');
          }
          if (sign.language?.id) return sign.language.id;
          if (sign.languageId) return sign.languageId;
          const languageId = sign.lessons?.find((l) => l.language?.id)?.language
            ?.id;
          if (languageId) return languageId;
          // Seña legacy sin languageId ni lección: sin idioma no hay permiso (BE-10).
          return null;
        }

        case 'lessonModel': {
          const model = await this.lessonModelRepository.findOne({
            where: { id: resourceId },
            relations: {
              lesson: {
                language: true,
              },

              lessonVariant: {
                baseLesson: {
                  language: true,
                },
              },
            },
          });
          if (!model) {
            throw new NotFoundException('errors.model.lessonModelNotFound');
          }
          return (
            model.lesson?.language?.id ||
            model.lessonVariant?.baseLesson?.language?.id ||
            null
          );
        }

        case 'signRecording': {
          const recording = await this.signRecordingRepository.findOne({
            where: { id: resourceId },
            relations: {
              sign: {
                language: true,

                lessons: {
                  language: true,
                },
              },
            },
          });
          if (!recording?.sign) {
            throw new NotFoundException('errors.recording.notFound');
          }
          if (recording.sign.language?.id) return recording.sign.language.id;
          if (recording.sign.languageId) return recording.sign.languageId;
          const languageId = recording.sign.lessons?.find((l) => l.language?.id)
            ?.language?.id;
          return languageId || null;
        }

        default:
          throw new Error(`Unknown entity type: ${entityName}`);
      }
    } else if (parts.length === 3) {
      const [entityName, relationName, property] = parts;

      if (
        entityName === 'quiz' &&
        relationName === 'lesson' &&
        property === 'languageId'
      ) {
        const quiz = await this.quizRepository.findOne({
          where: { id: resourceId },
          relations: {
            lesson: {
              language: true,
            },
          },
        });
        if (!quiz || !quiz.lesson) {
          throw new NotFoundException('errors.quiz.orLessonNotFound');
        }
        return quiz.lesson.language?.id || null;
      }

      if (
        entityName === 'quizVariant' &&
        relationName === 'lessonVariant' &&
        property === 'regionId'
      ) {
        const quizVariant = await this.quizVariantRepository.findOne({
          where: { id: resourceId },
          relations: {
            lessonVariant: {
              region: true,
            },
          },
        });
        if (!quizVariant || !quizVariant.lessonVariant) {
          throw new NotFoundException(
            'Quiz variant or lesson variant not found',
          );
        }
        return quizVariant.lessonVariant.region?.id || null;
      }

      if (
        entityName === 'variant' &&
        relationName === 'region' &&
        property === 'id'
      ) {
        const variant = await this.lessonVariantRepository.findOne({
          where: { id: resourceId },
          relations: {
            region: true,
          },
        });
        if (!variant) {
          throw new NotFoundException('errors.lesson.variantNotFound');
        }
        return variant.region?.id || null;
      }

      if (
        entityName === 'variant' &&
        relationName === 'baseLesson' &&
        property === 'languageId'
      ) {
        const variant = await this.lessonVariantRepository.findOne({
          where: { id: resourceId },
          relations: {
            baseLesson: {
              language: true,
            },
          },
        });
        if (!variant?.baseLesson) {
          throw new NotFoundException('errors.lesson.variantNotFound');
        }
        return variant.baseLesson.language?.id || null;
      }
    }

    throw new Error(`Unsupported resolve path: ${resolvePath}`);
  }
}
