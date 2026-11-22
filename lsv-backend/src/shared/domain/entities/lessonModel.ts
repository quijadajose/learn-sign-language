import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { Lesson } from './lesson.js';
import { LessonVariant } from './lessonVariant.js';
import { Language } from './language.js';

@Entity()
@Index('IDX_lesson_model_lessonId', ['lesson'])
@Index('IDX_lesson_model_lessonVariantId', ['lessonVariant'])
@Index('IDX_lesson_model_languageId', ['language'])
@Index('IDX_lesson_model_ready_lessonId_modelType', ['lesson', 'modelType'], {
  where: `"status" = 'READY'`,
})
export class LessonModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'TRAINING', 'READY', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'TRAINING' | 'READY' | 'FAILED';

  @Column({ nullable: true })
  modelJsonUrl: string;

  @Column('simple-array', { nullable: true })
  binUrls: string[];

  @Column('float', { nullable: true })
  accuracy: number;

  @Column('float', { default: 0 })
  progress: number;

  @Column({ nullable: true })
  trainingJobId: string;

  @Column('simple-array', { nullable: true })
  labels: string[];

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: ['static', 'dynamic'],
    default: 'static',
  })
  modelType: 'static' | 'dynamic';

  @Column('int', { default: 258 })
  featuresCount: number;

  /**
   * Contrato de features del artefacto. Vigentes: static-v2 (202D) y dynamic-v4
   * (340D, resample → deltas de manos y de brazos). Los dos parten del frame
   * capturado de 258D, con el pose escalado por ancho de hombros y recortado al
   * subconjunto de landmarks del contrato. Los registros viejos conservan su
   * versión legacy y se filtran al servirlos, así que no hace falta migrarlos.
   */
  @Column({ type: 'varchar', length: 32, nullable: true })
  featuresSchemaVersion: string | null;

  @ManyToOne(() => LessonVariant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  lessonVariant: Relation<LessonVariant>;

  @ManyToOne(() => Lesson, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  lesson: Relation<Lesson>;

  /** Expuesto en JSON para agrupar static+dynamic de la misma lección. */
  @RelationId((model: LessonModel) => model.lesson)
  lessonId: string | null;

  /**
   * BE-10: idioma del modelo. Los modelos custom no tienen lección, así que sin esto
   * no se puede autorizar a un moderador sobre ellos (solo un admin podría gestionarlos).
   */
  @ManyToOne(() => Language, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  language: Relation<Language> | null;

  @RelationId((model: LessonModel) => model.language)
  languageId: string | null;

  @Column('json', { nullable: true })
  trainingLogs: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
