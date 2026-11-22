import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Lesson } from './lesson.js';
import { QuizSubmission } from './quizSubmission.js';
import { Question } from './question.js';

@Entity()
@Index('IDX_quiz_lessonId', ['lesson'])
export class Quiz {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.quizzes, { onDelete: 'CASCADE' })
  lesson: Relation<Lesson>;

  @OneToMany(() => QuizSubmission, (submission) => submission.quiz, {
    onDelete: 'CASCADE',
  })
  submissions: Relation<QuizSubmission[]>;

  @OneToMany(() => Question, (question) => question.quiz, {
    onDelete: 'CASCADE',
  })
  questions: Relation<Question[]>;
}
