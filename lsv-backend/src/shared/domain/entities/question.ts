import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Quiz } from './quiz.js';
import { Option } from './option.js';

@Entity()
@Index('IDX_question_quizId', ['quiz'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  quiz?: Relation<Quiz>;

  @OneToMany(() => Option, (option) => option.question, { onDelete: 'CASCADE' })
  options: Relation<Option[]>;
}
