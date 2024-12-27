import { User } from "src/shared/domain/entities/user";

export interface UserRepositoryInterface {
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<User>;
}
