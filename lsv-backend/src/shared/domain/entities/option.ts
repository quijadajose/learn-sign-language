import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Question } from './question.js';

@Entity()
@Index('IDX_option_questionId', ['question'])
export class Option {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ManyToOne(() => Question, (question) => question.options, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  question?: Relation<Question>;
}
