import { Inject, Injectable } from '@nestjs/common';
import { RegisterUserUseCase } from '../domain/use-cases/register-user/register-user';
import { CreateUserDto } from './dtos/create-user/create-user';
import { User } from 'src/shared/domain/entities/user';
import { TokenService } from '../domain/ports/token.service/token.service.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly registerUserUseCase: RegisterUserUseCase,
        @Inject('TokenService')
        private readonly tokenService: TokenService,
    ) { }
    async registerUser(createUserDto: CreateUserDto): Promise<{ user: User, token: string }> {
        const user = await this.registerUserUseCase.register(createUserDto);
        user.hashPassword = undefined;
        user.googleId = undefined;
        user.updatedAt = undefined;
        const token = this.generateToken(user);
        return { user, token };
    }
    generateToken(payload: any): string {
        return this.tokenService.generateToken(payload);
    }
}
