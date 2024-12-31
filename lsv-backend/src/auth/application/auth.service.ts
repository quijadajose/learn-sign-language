import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RegisterUserUseCase } from '../domain/use-cases/register-user/register-user';
import { CreateUserDto } from './dtos/create-user/create-user';
import { User } from 'src/shared/domain/entities/user';
import { TokenService } from '../domain/ports/token.service/token.service.interface';
import { SendEmailUseCase } from '../domain/use-cases/send-email/send-email';
import { EmailParams } from '../domain/ports/email.service/email.service.interface';
import { ConfigService } from '@nestjs/config';
import { FindUserUseCase } from '../domain/use-cases/find-user/find-user';
import { HashService } from '../domain/ports/hash.service.interface/hash.service.interface';
import { UpdateUserUseCase } from '../domain/use-cases/update-user/update-user';

@Injectable()
export class AuthService {
    constructor(
        private configService: ConfigService,
        private readonly registerUserUseCase: RegisterUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly findUserUseCase: FindUserUseCase,
        private readonly sendEmailUseCase: SendEmailUseCase,
        @Inject('TokenService')
        private readonly tokenService: TokenService,
        @Inject('HashService')
        private readonly hashService: HashService
    ) { }
    async registerUser(createUserDto: CreateUserDto): Promise<{ user: User, token: string }> {
        const user = await this.registerUserUseCase.register(createUserDto);
        user.hashPassword = undefined;
        user.googleId = undefined;
        user.updatedAt = undefined;
        const token = this.generateToken(user);
        return { user, token };
    }
    generateToken(payload: User, expiresIn?: string): string {
        return this.tokenService.generateToken(payload, expiresIn);
    }
    async sendPasswordResetToken(email: string): Promise<void> {
        const user = await this.findUserUseCase.findByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const resetToken = this.generateToken(user, '15m'); // Implementa este método para generar el token
        const frontEndUrl = this.configService.get<string>('FRONTEND_URL')
        const resetUrl = `${frontEndUrl}/reset-password?token=${resetToken}`;

        const emailParams: EmailParams = {
            to: email,
            subject: 'Password Reset',
            body: `Please click the following link to reset your password: ${resetUrl}`,
        };

        await this.sendEmailUseCase.execute(emailParams);
    }
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // 1. Validar el token y extraer la información del usuario
        const payload = this.tokenService.verifyToken(token);
        if (!payload) {
            throw new BadRequestException('Invalid or expired token');
        }

        const { id: userId } = payload;

        // 2. Buscar al usuario por ID
        const user = await this.findUserUseCase.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        // 3. Actualizar la contraseña del usuario

        user.hashPassword = await this.hashService.hash(newPassword); // Asegúrate de que este campo será hasheado antes de guardarse
        await this.updateUserUseCase.execute(userId, user);

        const emailParams: EmailParams = {
            to: user.email,
            subject: 'Password Changed',
            body: 'Your password has been successfully updated.',
        };
        await this.sendEmailUseCase.execute(emailParams);
    }

}
