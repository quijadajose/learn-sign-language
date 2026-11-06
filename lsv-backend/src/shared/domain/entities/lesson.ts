import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { UserLesson } from './userLesson.js';
import { Stages } from './stage.js';
import { Language } from './language.js';
import { Quiz } from './quiz.js';
import { LessonVariant } from './lessonVariant.js';
import { Sign } from './sign.js';

@Entity()
@Index('IDX_lesson_languageId_stageId_createdAt', [
  'language',
  'stage',
  'createdAt',
])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Language, (language) => language.lessons, {
    onDelete: 'CASCADE',
  })
  language: Relation<Language>;

  @ManyToOne(() => Stages, (stage) => stage.lessons, { onDelete: 'SET NULL' })
  stage: Relation<Stages>;

  @OneToMany(() => UserLesson, (userLesson) => userLesson.lesson)
  userLessons: Relation<UserLesson[]>;

  @OneToMany(() => Quiz, (quiz) => quiz.lesson)
  quizzes: Relation<Quiz[]>;

  @OneToMany(() => LessonVariant, (variant) => variant.baseLesson)
  variants: Relation<LessonVariant[]>;

  @ManyToMany(() => Sign, (sign) => sign.lessons)
  signs: Relation<Sign[]>;
}
