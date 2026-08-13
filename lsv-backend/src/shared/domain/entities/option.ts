import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question';

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
  question?: Question;
}
