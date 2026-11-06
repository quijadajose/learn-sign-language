import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { UserLesson } from './userLesson.js';
import { QuizSubmission } from './quizSubmission.js';
import { UserLanguage } from './userLanguage.js';
import { UserRegion } from './userRegion.js';
import { ModeratorPermission } from './moderatorPermission.js';

@Entity()
@Index('UQ_user_googleId', ['googleId'], {
  unique: true,
  where: '"googleId" IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  hashPassword?: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  isRightHanded: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 'user' }) // 'user' | 'admin'
  role: string;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @OneToMany(() => UserLesson, (userLesson) => userLesson.user)
  userLessons: Relation<UserLesson[]>;

  @OneToMany(() => QuizSubmission, (submission) => submission.user)
  quizSubmissions: Relation<QuizSubmission[]>;

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.user)
  userLanguages: Relation<UserLanguage[]>;

  @OneToMany(() => UserRegion, (userRegion) => userRegion.user)
  userRegions: Relation<UserRegion[]>;

  @OneToMany(
    () => ModeratorPermission,
    (moderatorPermission) => moderatorPermission.user,
  )
  moderatorPermissions: Relation<ModeratorPermission[]>;
}
