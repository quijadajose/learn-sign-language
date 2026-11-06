import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { QuizVariant } from './quizVariant.js';
import type { OptionVariant } from './optionVariant.js';

@Entity()
export class QuestionVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @ManyToOne(() => QuizVariant, (quizVariant) => quizVariant.questionVariants, {
    onDelete: 'CASCADE',
  })
  quizVariant: Relation<QuizVariant>;

  @OneToMany(
    'OptionVariant',
    (optionVariant: OptionVariant) => optionVariant.questionVariant,
  )
  optionVariants: Relation<OptionVariant[]>;
}
