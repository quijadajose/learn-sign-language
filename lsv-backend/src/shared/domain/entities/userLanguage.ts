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
import { Language } from './language.js';

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
  user: Relation<User>;

  @ManyToOne(() => Language, (language) => language.userLanguages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageId' })
  language: Relation<Language>;
}
