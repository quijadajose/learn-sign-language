import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizVariant } from './quizVariant';

@Entity()
export class QuestionVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column({ nullable: true })
  explanation: string;

  @ManyToOne(() => QuizVariant, (quizVariant) => quizVariant.questionVariants, {
    onDelete: 'CASCADE',
  })
  quizVariant: QuizVariant;

  @OneToMany('OptionVariant', (optionVariant: any) => optionVariant.questionVariant)
  optionVariants: any[];
}
