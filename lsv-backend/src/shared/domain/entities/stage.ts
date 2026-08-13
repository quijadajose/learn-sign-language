import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from './language';
import { Lesson } from './lesson';

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
  language: Language;

  @OneToMany(() => Lesson, (lesson) => lesson.stage)
  lessons: Lesson[];
}
