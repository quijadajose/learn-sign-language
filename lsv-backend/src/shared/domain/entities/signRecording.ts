import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sign } from './sign';
import { Region } from './region';

@Entity()
export class SignRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  landmarks: any;

  @Column({ nullable: true })
  dominantHand: string;

  @ManyToOne(() => Sign, {
    onDelete: 'CASCADE',
  })
  sign: Sign;

  @ManyToOne(() => Region, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  region: Region;

  @CreateDateColumn()
  createdAt: Date;
}
