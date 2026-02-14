import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserLesson } from './userLesson';
import { QuizSubmission } from './quizSubmission';
import { UserLanguage } from './userLanguage';
import { UserRegion } from './userRegion';
import { ModeratorPermission } from './moderatorPermission';

@Entity()
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

  @OneToMany(() => UserLesson, (userLesson) => userLesson.user)
  userLessons: UserLesson[];

  @OneToMany(() => QuizSubmission, (submission) => submission.user)
  quizSubmissions: QuizSubmission[];

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.user)
  userLanguages: UserLanguage[];

  @OneToMany(() => UserRegion, (userRegion) => userRegion.user)
  userRegions: UserRegion[];

  @OneToMany(
    () => ModeratorPermission,
    (moderatorPermission) => moderatorPermission.user,
  )
  moderatorPermissions: ModeratorPermission[];
}
