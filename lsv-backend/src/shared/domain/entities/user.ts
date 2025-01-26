import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserLesson } from "./userLesson";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
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
}