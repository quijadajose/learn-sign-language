import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizVariant } from './quizVariant';
import type { OptionVariant } from './optionVariant';

@Entity()
export class QuestionVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @ManyToOne(() => QuizVariant, (quizVariant) => quizVariant.questionVariants, {
    onDelete: 'CASCADE',
  })
  quizVariant: QuizVariant;

  @OneToMany(
    'OptionVariant',
    (optionVariant: OptionVariant) => optionVariant.questionVariant,
  )
  optionVariants: OptionVariant[];
}
