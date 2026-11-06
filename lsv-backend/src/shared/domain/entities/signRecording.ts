import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Sign } from './sign.js';
import { Region } from './region.js';

@Entity()
@Index('IDX_sign_recording_signId_regionId', ['sign', 'region'])
@Index('IDX_sign_recording_validated_signId_regionId', ['sign', 'region'], {
  where: '"isValidated" = true',
})
export class SignRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  landmarks: unknown[];

  @Column({ nullable: true })
  dominantHand: string;

  @Column({ default: false })
  isValidated: boolean;

  @Column('float', { nullable: true })
  handConfidence: number;

  @ManyToOne(() => Sign, {
    onDelete: 'CASCADE',
  })
  sign: Relation<Sign>;

  @ManyToOne(() => Region, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  region: Relation<Region>;

  @CreateDateColumn()
  createdAt: Date;
}
