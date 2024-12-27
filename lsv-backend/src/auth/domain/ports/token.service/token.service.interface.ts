import { User } from "src/shared/domain/entities/user";

export interface TokenService {
    generateToken(user: User): string;
}