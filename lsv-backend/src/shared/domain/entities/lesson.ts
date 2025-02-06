import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserLesson } from './userLesson';
import { Stages } from './stage';
import { Language } from './language';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true })
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Language, (language) => language.lessons, {
    onDelete: 'CASCADE',
  })
  language: Language;

  @ManyToOne(() => Stages, (stage) => stage.lessons, { onDelete: 'SET NULL' })
  stage: Stages;

  @OneToMany(() => UserLesson, (userLesson) => userLesson.lesson)
  userLessons: UserLesson[];
}
