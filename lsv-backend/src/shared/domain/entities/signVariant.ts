import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sign } from './sign';
import { Region } from './region';

@Entity()
@Index('IDX_sign_variant_signId_regionId', ['sign', 'region'])
export class SignVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  landmarks: unknown[] | null;

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
