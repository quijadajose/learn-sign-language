import {
  JwtPayload,
  JwtPurpose,
} from '../../../interfaces/jwt-payload.interface.js';
import { User } from '../../../../shared/domain/entities/user.js';

export type GenerateTokenOptions = {
  expiresIn?: string;
  purpose?: JwtPurpose;
};

export interface TokenService {
  generateToken(user: User, options?: GenerateTokenOptions): string;
  verifyToken(token: string, expectedPurpose?: JwtPurpose): JwtPayload;
}
