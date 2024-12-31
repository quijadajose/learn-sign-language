import { User } from "src/shared/domain/entities/user";

export interface TokenService {
    generateToken(user: User, expiresIn?: string): string;
    verifyToken(token: string): User;
}