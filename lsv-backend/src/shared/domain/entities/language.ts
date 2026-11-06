import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { Stages } from './stage.js';
import { Lesson } from './lesson.js';
import { UserLanguage } from './userLanguage.js';
import { Region } from './region.js';
import { Country } from './iso-3166-2/countries.js';

@Entity()
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  countryCode: string;

  @ManyToOne(() => Country, (country) => country.code, {
    onDelete: 'SET NULL',
  })
  country: Relation<Country>;

  @OneToMany(() => Stages, (stage) => stage.language)
  stages: Relation<Stages[]>;

  @OneToMany(() => Lesson, (lesson) => lesson.language)
  lessons: Relation<Lesson[]>;

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.language)
  userLanguages: Relation<UserLanguage[]>;

  @OneToMany(() => Region, (region) => region.language, {
    cascade: true,
  })
  regions: Relation<Region[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
