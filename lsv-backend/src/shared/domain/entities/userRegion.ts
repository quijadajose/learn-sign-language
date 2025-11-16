import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user';
import { Region } from './region';

@Entity()
export class UserRegion {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  regionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userRegions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Region, (region) => region.userRegions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'regionId' })
  region: Region;
}
