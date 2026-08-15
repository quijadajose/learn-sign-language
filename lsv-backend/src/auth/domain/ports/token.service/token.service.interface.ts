import {
  JwtPayload,
  JwtPurpose,
} from 'src/auth/interfaces/jwt-payload.interface';
import { User } from 'src/shared/domain/entities/user';

export type GenerateTokenOptions = {
  expiresIn?: string;
  purpose?: JwtPurpose;
};

export interface TokenService {
  generateToken(user: User, options?: GenerateTokenOptions): string;
  verifyToken(token: string, expectedPurpose?: JwtPurpose): JwtPayload;
}
