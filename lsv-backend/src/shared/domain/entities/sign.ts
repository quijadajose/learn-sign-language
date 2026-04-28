import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { Lesson } from './lesson';
import { SignVariant } from './signVariant';
import { SignRecording } from './signRecording';

@Entity()
export class Sign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  isGlobal: boolean;

  @Column('jsonb', { nullable: true })
  landmarks: any;

  @ManyToMany(() => Lesson, (lesson) => lesson.signs)
  @JoinTable({ name: 'lesson_signs' })
  lessons: Lesson[];

  @OneToMany(() => SignVariant, (variant) => variant.sign)
  variants: SignVariant[];

  @OneToMany(() => SignRecording, (recording) => recording.sign)
  recordings: SignRecording[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
