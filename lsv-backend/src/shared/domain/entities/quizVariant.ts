import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { LessonVariant } from './lessonVariant.js';
import { QuestionVariant } from './questionVariant.js';
import { QuizSubmission } from './quizSubmission.js';

@Entity()
export class QuizVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => LessonVariant,
    (lessonVariant) => lessonVariant.quizVariants,
    {
      onDelete: 'CASCADE',
    },
  )
  lessonVariant: Relation<LessonVariant>;

  @OneToMany(
    () => QuestionVariant,
    (questionVariant) => questionVariant.quizVariant,
  )
  questionVariants: Relation<QuestionVariant[]>;

  @OneToMany(() => QuizSubmission, (submission) => submission.quizVariant, {
    onDelete: 'CASCADE',
  })
  submissions: Relation<QuizSubmission[]>;
}
