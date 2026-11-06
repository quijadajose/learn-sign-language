import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { QuestionVariant } from './questionVariant.js';

@Entity()
export class OptionVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne(
    () => QuestionVariant,
    (questionVariant) => questionVariant.optionVariants,
    {
      onDelete: 'CASCADE',
    },
  )
  questionVariant: Relation<QuestionVariant>;
}
