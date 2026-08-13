import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quiz } from './quiz';
import { Option } from './option';

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
  quiz?: Quiz;

  @OneToMany(() => Option, (option) => option.question, { onDelete: 'CASCADE' })
  options: Option[];
}
