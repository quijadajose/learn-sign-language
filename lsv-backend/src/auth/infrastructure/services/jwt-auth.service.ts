import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/auth/domain/ports/token.service/token.service.interface';
import { User } from 'src/shared/domain/entities/user';

@Injectable()
export class JwtAuthService implements TokenService {
    constructor(private readonly jwtService: JwtService) { }

    generateToken(user: User): string {
        const payload = { username: user.email, sub: user.id };
        return this.jwtService.sign(payload);
    }
}