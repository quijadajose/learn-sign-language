import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from './user.js';
import { Quiz } from './quiz.js';
import { QuizVariant } from './quizVariant.js';

@Entity()
@Index('IDX_quiz_submission_userId_quizId', ['user', 'quiz'])
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.quizSubmissions)
  user: Relation<User>;

  @ManyToOne(() => Quiz, (quiz) => quiz.submissions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  quiz?: Relation<Quiz>;

  @ManyToOne(() => QuizVariant, (quizVariant) => quizVariant.submissions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  quizVariant?: Relation<QuizVariant>;

  @Column({ type: 'json', nullable: true, default: null })
  answers: JSON;

  @Column({ type: 'int', nullable: true, default: null })
  score?: number;

  @CreateDateColumn()
  submittedAt: Date;
}
