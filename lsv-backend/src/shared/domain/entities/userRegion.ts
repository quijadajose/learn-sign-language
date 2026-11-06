import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { User } from './user.js';
import { Region } from './region.js';

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
  user: Relation<User>;

  @ManyToOne(() => Region, (region) => region.userRegions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'regionId' })
  region: Relation<Region>;
}
