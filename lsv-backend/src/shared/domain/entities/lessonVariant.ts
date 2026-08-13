import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from './lesson';
import { Region } from './region';
import type { QuizVariant } from './quizVariant';

@Entity()
@Index('IDX_lesson_variant_baseLessonId_regionId', ['baseLesson', 'region'])
@Index('IDX_lesson_variant_base_baseLessonId', ['baseLesson'], {
  where: '"isBase" = true',
})
export class LessonVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRegionalSpecific: boolean;

  @Column({ default: false })
  isBase: boolean;
  @Column('text', { nullable: true })
  regionalNotes: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.variants, {
    onDelete: 'CASCADE',
  })
  baseLesson: Lesson;

  @ManyToOne(() => Region, (region) => region.lessonVariants, {
    onDelete: 'CASCADE',
  })
  region: Region;

  @OneToMany(
    'QuizVariant',
    (quizVariant: QuizVariant) => quizVariant.lessonVariant,
  )
  quizVariants: QuizVariant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
