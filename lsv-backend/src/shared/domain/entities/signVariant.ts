import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sign } from './sign';
import { Region } from './region';

@Entity()
export class SignVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  landmarks: any;

  @Column({ nullable: true })
  mediaUrl: string;

  @ManyToOne(() => Sign, (sign) => sign.variants, {
    onDelete: 'CASCADE',
  })
  sign: Sign;

  @ManyToOne(() => Region, {
    onDelete: 'CASCADE',
  })
  region: Region;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
