import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from './user.js';
import { Language } from './language.js';
import { Region } from './region.js';

export enum PermissionScope {
  LANGUAGE = 'language',
  REGION = 'region',
}

@Entity()
@Index('IDX_moderator_permission_userId', ['userId'])
export class ModeratorPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.moderatorPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: PermissionScope,
  })
  scope: PermissionScope;

  // Relación opcional con Language (para Moderadores de Lenguaje)
  @ManyToOne(() => Language, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'languageId' })
  language?: Relation<Language>;

  @Column({ nullable: true })
  languageId?: string;

  // Relación opcional con Region (para Moderadores de Región)
  @ManyToOne(() => Region, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'regionId' })
  region?: Relation<Region>;

  @Column({ nullable: true })
  regionId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
