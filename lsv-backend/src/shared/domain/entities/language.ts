import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserLesson } from "./userLesson";
import { Stages } from "./stage";
import { Lesson } from "./lesson";

@Entity()
export class Language {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    name: string;

    @Column('text')
    description: string;

    @OneToMany(() => Stages, (stage) => stage.language)
    stages: Stages[];

    @OneToMany(() => Lesson, (lesson) => lesson.language)
    lessons: Lesson[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}