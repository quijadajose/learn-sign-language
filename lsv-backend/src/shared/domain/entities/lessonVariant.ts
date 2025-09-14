import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from './lesson';
import { Region } from './region';

@Entity()
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

  @OneToMany('QuizVariant', (quizVariant: any) => quizVariant.lessonVariant)
  quizVariants: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
