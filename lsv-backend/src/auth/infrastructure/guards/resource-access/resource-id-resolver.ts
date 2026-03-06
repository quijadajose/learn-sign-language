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
  ) {}

  async resolveResourceId(
    source: ResourcePermissionSource,
    params: Record<string, any>,
    body: any,
    query: Record<string, any>,
  ): Promise<string | null> {
    // Primero intentar obtener el ID desde params, body o query
    let resourceId: string | null = null;

    if (source.param && params[source.param]) {
      resourceId = params[source.param];
    } else if (source.body && body && body[source.body]) {
      resourceId = body[source.body];
    } else if (source.query && query[source.query]) {
      resourceId = query[source.query];
    }

    if (!resourceId) {
      return null;
    }

    // Si hay un resolve path, necesitamos obtener el ID desde la relación
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
        case 'lesson':
          const lesson = await this.lessonRepository.findOne({
            where: { id: resourceId },
            relations: ['language'],
          });
          if (!lesson) {
            throw new NotFoundException('Lesson not found');
          }
          return lesson.language?.id || null;

        case 'stage':
          const stage = await this.stageRepository.findOne({
            where: { id: resourceId },
            relations: ['language'],
          });
          if (!stage) {
            throw new NotFoundException('Stage not found');
          }
          return stage.language?.id || null;

        case 'region':
          const region = await this.regionRepository.findOne({
            where: { id: resourceId },
            relations: ['language'],
          });
          if (!region) {
            throw new NotFoundException('Region not found');
          }
          if (property === 'languageId') {
            return region.language?.id || null;
          }
          return region[property] || null;

        case 'variant':
          const variant = await this.lessonVariantRepository.findOne({
            where: { id: resourceId },
            relations: ['region'],
          });
          if (!variant) {
            throw new NotFoundException('Lesson variant not found');
          }
          return variant.region?.id || null;

        default:
          throw new Error(`Unknown entity type: ${entityName}`);
      }
    } else if (parts.length === 3) {
      // Casos como quiz.lesson.languageId
      const [entityName, relationName, property] = parts;

      if (
        entityName === 'quiz' &&
        relationName === 'lesson' &&
        property === 'languageId'
      ) {
        const quiz = await this.quizRepository.findOne({
          where: { id: resourceId },
          relations: ['lesson', 'lesson.language'],
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
          relations: ['lessonVariant', 'lessonVariant.region'],
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
          relations: ['region'],
        });
        if (!variant) {
          throw new NotFoundException('Lesson variant not found');
        }
        return variant.region?.id || null;
      }
    }

    throw new Error(`Unsupported resolve path: ${resolvePath}`);
  }
}
