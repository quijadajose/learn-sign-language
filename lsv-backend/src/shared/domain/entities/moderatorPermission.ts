import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user';
import { Language } from './language';
import { Region } from './region';

export enum PermissionScope {
  LANGUAGE = 'language',
  REGION = 'region',
}

@Entity()
export class ModeratorPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.moderatorPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

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
  language?: Language;

  @Column({ nullable: true })
  languageId?: string;

  // Relación opcional con Region (para Moderadores de Región)
  @ManyToOne(() => Region, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'regionId' })
  region?: Region;

  @Column({ nullable: true })
  regionId?: string;

  @CreateDateColumn()
  createdAt: Date;
}







