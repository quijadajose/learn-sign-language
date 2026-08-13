import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from './lesson';
import { LessonVariant } from './lessonVariant';

@Entity()
@Index('IDX_lesson_model_lessonId', ['lesson'])
@Index('IDX_lesson_model_lessonVariantId', ['lessonVariant'])
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
   * Contrato de features del artefacto. Vigentes: static-v2 (202D) y dynamic-v3
   * (340D, deltas de manos y de brazos → resample). Los dos parten del frame
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
  lessonVariant: LessonVariant;

  @ManyToOne(() => Lesson, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  lesson: Lesson;

  /** Expuesto en JSON para agrupar static+dynamic de la misma lección. */
  @RelationId((model: LessonModel) => model.lesson)
  lessonId: string | null;

  @Column('json', { nullable: true })
  trainingLogs: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
