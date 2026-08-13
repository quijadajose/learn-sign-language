import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from './language';
import { Division } from './iso-3166-2/divisions';
import { UserRegion } from './userRegion';
import type { LessonVariant } from './lessonVariant';

@Entity()
@Index('IDX_region_languageId', ['languageId'])
@Index('IDX_region_code', ['code'])
@Index('IDX_region_default_languageId', ['languageId'], {
  where: '"isDefault" = true',
})
export class Region {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  code: string; // Código del estado federal (ej: "NE", "CDMX", "ZU")

  @Column('text')
  description: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  languageId: string;

  @Column({ nullable: true })
  divisionCode: string;

  @ManyToOne(() => Language, (language) => language.regions, {
    onDelete: 'CASCADE',
  })
  language: Language;

  @ManyToOne(() => Division, (division) => division.code, {
    onDelete: 'SET NULL',
  })
  division: Division;

  @OneToMany('LessonVariant', (variant: LessonVariant) => variant.region)
  lessonVariants: LessonVariant[];

  @OneToMany(() => UserRegion, (userRegion) => userRegion.region)
  userRegions: UserRegion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
