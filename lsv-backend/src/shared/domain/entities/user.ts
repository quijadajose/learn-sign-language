import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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
}