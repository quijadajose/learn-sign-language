import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LessonVariant } from './lessonVariant';

@Entity()
export class LessonModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'TRAINING', 'READY', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'TRAINING' | 'READY' | 'FAILED';

  @Column({ nullable: true })
  modelJsonUrl: string;

  @Column('simple-array', { nullable: true })
  binUrls: string[];

  @Column('float', { nullable: true })
  accuracy: number;

  @Column('float', { default: 0 })
  progress: number;

  @Column({ nullable: true })
  trainingJobId: string;

  @Column('simple-array', { nullable: true })
  labels: string[];

  @Column({ nullable: true })
  name: string;

  @ManyToOne(() => LessonVariant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  lessonVariant: LessonVariant;

  @Column('json', { nullable: true })
  trainingLogs: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
