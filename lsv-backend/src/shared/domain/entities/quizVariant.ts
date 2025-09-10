import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LessonVariant } from './lessonVariant';
import { QuestionVariant } from './questionVariant';
import { QuizSubmission } from './quizSubmission';

@Entity()
export class QuizVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LessonVariant, (lessonVariant) => lessonVariant.quizVariants, {
    onDelete: 'CASCADE',
  })
  lessonVariant: LessonVariant;

  @OneToMany(() => QuestionVariant, (questionVariant) => questionVariant.quizVariant)
  questionVariants: QuestionVariant[];

  @OneToMany(() => QuizSubmission, (submission) => submission.quizVariant, {
    onDelete: 'CASCADE',
  })
  submissions: QuizSubmission[];
}
