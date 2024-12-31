import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/auth/domain/ports/token.service/token.service.interface';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { User } from 'src/shared/domain/entities/user';

@Injectable()
export class JwtAuthService implements TokenService {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService) { }

    generateToken(user: User, expiresIn?: string): string {
        const payload = { email: user.email, sub: user.id };
        return this.jwtService.sign(payload, expiresIn ? { expiresIn } : undefined);
    }
    verifyToken(token: string): JwtPayload {
        try {
            const decoded = this.jwtService.verify(token, { secret: this.configService.get<string>('JWT_SECRET') });
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                throw new UnauthorizedException('Token has expired');
            }
            return decoded;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}