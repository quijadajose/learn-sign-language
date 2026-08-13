import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourcePermissionSource } from '../../interfaces/resource-permission-metadata.interface';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Region } from 'src/shared/domain/entities/region';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { Sign } from 'src/shared/domain/entities/sign';
import { LessonModel } from 'src/shared/domain/entities/lessonModel';
import { SignRecording } from 'src/shared/domain/entities/signRecording';

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
            throw new NotFoundException('Lesson not found');
          }
          return lesson.language?.id || null;
        }

        case 'stage': {
          const stage = await this.stageRepository.findOne({
            where: { id: resourceId },
            relations: {
              language: true,
            },
          });
          if (!stage) {
            throw new NotFoundException('Stage not found');
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
            throw new NotFoundException('Region not found');
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
            throw new NotFoundException('Lesson variant not found');
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
            throw new NotFoundException('Sign not found');
          }
          if (sign.language?.id) return sign.language.id;
          if (sign.languageId) return sign.languageId;
          const languageId = sign.lessons?.find((l) => l.language?.id)?.language
            ?.id;
          if (languageId) return languageId;
          // Seña legacy sin languageId ni lección: allowUnscopedModerator
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
            throw new NotFoundException('Lesson model not found');
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
            throw new NotFoundException('Recording not found');
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
          throw new NotFoundException('Quiz or lesson not found');
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
          throw new NotFoundException('Lesson variant not found');
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
          throw new NotFoundException('Lesson variant not found');
        }
        return variant.baseLesson.language?.id || null;
      }
    }

    throw new Error(`Unsupported resolve path: ${resolvePath}`);
  }
}
