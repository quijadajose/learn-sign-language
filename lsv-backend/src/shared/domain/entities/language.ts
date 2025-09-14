import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stages } from './stage';
import { Lesson } from './lesson';
import { UserLanguage } from './userLanguage';
import { Region } from './region';
import { Country } from './iso-3166-2/countries';

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
  country: Country;

  @OneToMany(() => Stages, (stage) => stage.language)
  stages: Stages[];

  @OneToMany(() => Lesson, (lesson) => lesson.language)
  lessons: Lesson[];

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.language)
  userLanguages: UserLanguage[];

  @OneToMany(() => Region, (region) => region.language, {
    cascade: true,
  })
  regions: Region[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
