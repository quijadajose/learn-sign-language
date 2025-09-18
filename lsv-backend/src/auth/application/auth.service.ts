import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../domain/use-cases/register-user/register-user';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { User } from 'src/shared/domain/entities/user';
import { TokenService } from '../domain/ports/token.service/token.service.interface';
import { SendEmailUseCase } from '../domain/use-cases/send-email/send-email';
import { EmailParams } from '../domain/ports/email.service/email.service.interface';
import { ConfigService } from '@nestjs/config';
import { FindUserUseCase } from '../domain/use-cases/find-user/find-user';
import { HashService } from '../domain/ports/hash.service.interface/hash.service.interface';
import { UpdateUserUseCase } from '../domain/use-cases/update-user/update-user';
import { LoginUserDto } from './dto/login-user/login-user';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UpdateUserDto } from '../domain/dto/update-user/update-user';

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
    private readonly hashService: HashService,
  ) {}
  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const user = await this.registerUserUseCase.register(createUserDto);
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    const token = this.generateToken(user);
    return { user, token };
  }
  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: User; token: string }> {
    const user = await this.findUserUseCase.findByEmail(loginUserDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashService.compare(
      loginUserDto.password,
      user.hashPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    return { user, token };
  }
  generateToken(payload: User, expiresIn?: string): string {
    return this.tokenService.generateToken(payload, expiresIn);
  }
  async sendPasswordResetToken(email: string): Promise<void> {
    const user = await this.findUserUseCase.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = this.generateToken(user, '15m');
    const frontEndUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontEndUrl}/reset-password?token=${resetToken}`;

    const emailParams: EmailParams = {
      to: email,
      subject: '🔐 Restablecer Contraseña - LSV',
      body: this.generatePasswordResetEmailHTML(resetUrl),
    };

    await this.sendEmailUseCase.execute(emailParams);
  }
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload: JwtPayload = this.tokenService.verifyToken(token);

    if (!payload) {
      throw new BadRequestException('Invalid or expired token');
    }

    const { sub: userId } = payload;

    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.hashPassword = await this.hashService.hash(newPassword);

    await this.updateUserUseCase.execute(userId, user);

    const emailParams: EmailParams = {
      to: user.email,
      subject: '✅ Contraseña Actualizada - LSV',
      body: this.generatePasswordChangedEmailHTML(),
    };
    await this.sendEmailUseCase.execute(emailParams);
  }
  async getUserProfile(userId: string): Promise<User> {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (updateUserDto.oldPassword && updateUserDto.newPassword) {
      const isCurrentPassword = await this.hashService.compare(
        updateUserDto.oldPassword,
        user.hashPassword,
      );
      if (!isCurrentPassword) {
        throw new BadRequestException('Current password does not match');
      }

      const isSamePassword = await this.hashService.compare(
        updateUserDto.newPassword,
        user.hashPassword,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      updateUserDto.hashPassword = await this.hashService.hash(
        updateUserDto.newPassword,
      );

      delete updateUserDto.oldPassword;
      delete updateUserDto.newPassword;
    }

    const updatedUser = await this.updateUserUseCase.execute(
      userId,
      updateUserDto,
    );
    return updatedUser;
  }

  private generatePasswordChangedEmailHTML(): string {
    return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Contraseña Actualizada - LSV</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif; color:#333;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            
            <tr>
              <td align="center" bgcolor="#28a745" style="padding:30px 20px; color:#ffffff; font-size:28px; font-weight:bold;">
                ✅ LSV
              </td>
            </tr>
  
            <tr>
              <td style="padding:40px 30px;">
                <h2 style="color:#2c3e50; font-size:22px; margin:0 0 20px 0;">Contraseña Actualizada Exitosamente</h2>
                <p style="font-size:16px; color:#555; margin:0 0 20px 0;">Hola,</p>
                <p style="font-size:16px; color:#555; margin:0 0 20px 0;">
                  Te confirmamos que tu contraseña ha sido actualizada exitosamente en tu cuenta de LSV. 
                  Tu cuenta ahora está protegida con la nueva contraseña que configuraste.
                </p>
  
                <table role="presentation" border="0" cellpadding="15" cellspacing="0" width="100%" style="background-color:#d4edda; border-left:4px solid #28a745; margin:20px 0;">
                  <tr>
                    <td style="font-size:14px; color:#155724;">
                      <strong style="color:#28a745; font-size:16px;">🔒 Información de Seguridad</strong>
                      <p style="margin:10px 0 0 0;">• Tu contraseña ha sido cambiada exitosamente.</p>
                      <p style="margin:5px 0 0 0;">• Si no realizaste este cambio, contacta inmediatamente con soporte.</p>
                      <p style="margin:5px 0 0 0;">• Mantén tu contraseña segura y no la compartas con nadie.</p>
                    </td>
                  </tr>
                </table>
  
                <p style="font-size:16px; color:#555; margin:20px 0;">
                  Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
                </p>
              </td>
            </tr>
  
            <tr>
              <td align="center" bgcolor="#f8f9fa" style="padding:20px 30px; font-size:14px; color:#666; border-top:1px solid #e9ecef;">
                Este es un email automático, por favor no respondas a este mensaje.
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
    `;
  }

  private generatePasswordResetEmailHTML(resetUrl: string): string {
    return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña - LSV</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif; color:#333;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            
            <tr>
              <td align="center" bgcolor="#667eea" style="padding:30px 20px; color:#ffffff; font-size:28px; font-weight:bold;">
                🔐 LSV
              </td>
            </tr>
  
            <tr>
              <td style="padding:40px 30px;">
                <h2 style="color:#2c3e50; font-size:22px; margin:0 0 20px 0;">Restablecer tu Contraseña</h2>
                <p style="font-size:16px; color:#555; margin:0 0 20px 0;">Hola,</p>
                <p style="font-size:16px; color:#555; margin:0 0 20px 0;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en LSV. 
                  Si fuiste tú quien hizo esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña.
                </p>
  
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:20px auto;">
                  <tr>
                    <td bgcolor="#667eea" style="border-radius:25px;">
                      <a href="${resetUrl}" target="_blank" 
                        style="display:inline-block; padding:15px 30px; font-size:16px; font-weight:bold; 
                        color:#ffffff; text-decoration:none; border-radius:25px; background-color:#667eea;">
                        Restablecer Contraseña
                      </a>
                    </td>
                  </tr>
                </table>
  
                <table role="presentation" border="0" cellpadding="15" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-left:4px solid #28a745; margin:20px 0;">
                  <tr>
                    <td style="font-size:14px; color:#666;">
                      <strong style="color:#28a745; font-size:16px;">🛡️ Información de Seguridad</strong>
                      <p style="margin:10px 0 0 0;">• Este enlace expirará en <span style="color:#dc3545; font-weight:bold;">15 minutos</span>.</p>
                      <p style="margin:5px 0 0 0;">• Si no solicitaste este cambio, puedes ignorar este email.</p>
                      <p style="margin:5px 0 0 0;">• Tu contraseña actual seguirá siendo válida hasta que la cambies.</p>
                    </td>
                  </tr>
                </table>
  
                <p style="font-size:14px; color:#555;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="font-size:12px; font-family: monospace; word-break:break-all; background-color:#f8f9fa; padding:10px; border-radius:5px;">
                  ${resetUrl}
                </p>
              </td>
            </tr>
  
            <tr>
              <td align="center" bgcolor="#f8f9fa" style="padding:20px 30px; font-size:14px; color:#666; border-top:1px solid #e9ecef;">
                Este es un email automático, por favor no respondas a este mensaje.
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
    `;
  }
}
