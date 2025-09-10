import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from './language';

@Entity()
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
  isDefault: boolean; // Región base/nacional

  @ManyToOne(() => Language, (language) => language.regions, {
    onDelete: 'CASCADE',
  })
  language: Language;

  @OneToMany('LessonVariant', (variant: any) => variant.region)
  lessonVariants: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
