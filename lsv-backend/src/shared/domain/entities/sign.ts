import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
  JoinTable,
  Relation,
} from 'typeorm';
import { Lesson } from './lesson.js';
import { Language } from './language.js';
import { SignVariant } from './signVariant.js';
import { SignRecording } from './signRecording.js';

@Entity()
@Index('IDX_sign_languageId', ['language'])
export class Sign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({
    type: 'enum',
    enum: ['static', 'dynamic'],
    default: 'static',
  })
  detectionType: 'static' | 'dynamic';

  @Column('jsonb', { nullable: true })
  landmarks: unknown[] | null;

  @ManyToOne(() => Language, { onDelete: 'SET NULL', nullable: true })
  language: Relation<Language> | null;

  /** Ownership explícito para ACL (evita depender solo del join lesson_signs). */
  @RelationId((sign: Sign) => sign.language)
  languageId: string | null;

  @ManyToMany(() => Lesson, (lesson) => lesson.signs)
  @JoinTable({ name: 'lesson_signs' })
  lessons: Relation<Lesson[]>;

  @OneToMany(() => SignVariant, (variant) => variant.sign)
  variants: Relation<SignVariant[]>;

  @OneToMany(() => SignRecording, (recording) => recording.sign)
  recordings: Relation<SignRecording[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
