import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user';
import { Language } from './language';

@Entity()
export class UserLanguage {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  languageId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userLanguages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Language, (language) => language.userLanguages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageId' })
  language: Language;
}
