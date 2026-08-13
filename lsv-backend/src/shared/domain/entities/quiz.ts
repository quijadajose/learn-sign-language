import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lesson } from './lesson';
import { QuizSubmission } from './quizSubmission';
import { Question } from './question';

@Entity()
@Index('IDX_quiz_lessonId', ['lesson'])
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.quizzes, { onDelete: 'CASCADE' })
  lesson: Lesson;

  @OneToMany(() => QuizSubmission, (submission) => submission.quiz, {
    onDelete: 'CASCADE',
  })
  submissions: QuizSubmission[];

  @OneToMany(() => Question, (question) => question.quiz, {
    onDelete: 'CASCADE',
  })
  questions: Question[];
}
