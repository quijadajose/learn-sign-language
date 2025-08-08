import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { User } from 'src/shared/domain/entities/user';

export interface TokenService {
  generateToken(user: User, expiresIn?: string): string;
  verifyToken(token: string): JwtPayload;
}
