import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { Language } from './language.js';
import { Lesson } from './lesson.js';

@Entity()
@Index('IDX_stages_languageId', ['language'])
export class Stages {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @ManyToOne(() => Language, (language) => language.stages, {
    onDelete: 'CASCADE',
  })
  language: Relation<Language>;

  @OneToMany(() => Lesson, (lesson) => lesson.stage)
  lessons: Relation<Lesson[]>;
}
