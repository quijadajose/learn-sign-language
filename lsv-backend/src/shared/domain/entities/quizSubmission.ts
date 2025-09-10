import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user';
import { Quiz } from './quiz';
import { QuizVariant } from './quizVariant';

@Entity()
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.quizSubmissions)
  user: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.submissions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  quiz?: Quiz;

  @ManyToOne(() => QuizVariant, (quizVariant) => quizVariant.submissions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  quizVariant?: QuizVariant;

  @Column({ type: 'json', nullable: true, default: null })
  answers: JSON;

  @Column({ type: 'int', nullable: true, default: null })
  score?: number;

  @CreateDateColumn()
  submittedAt: Date;
}
