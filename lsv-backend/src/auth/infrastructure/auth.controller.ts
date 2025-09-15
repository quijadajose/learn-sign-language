import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { AuthService } from '../application/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ResetPassword } from '../application/dto/reset-password/reset-password';
import { ConfirmResetPasswordDto } from '../application/dto/confirm-reset-password/confirm-reset-password-dto';
import { LoginUserDto } from '../application/dto/login-user/login-user';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario en el sistema',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos del usuario a registrar',
    examples: {
      example1: {
        summary: 'Ejemplo de registro de usuario',
        description:
          'Ejemplo completo de los datos requeridos para registrar un nuevo usuario',
        value: {
          email: 'email@gmail.com',
          password: 'hashedPassword',
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          isRightHanded: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User registered successfully',
        },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  example: 'email@gmail.com',
                },
                firstName: {
                  type: 'string',
                  example: 'John',
                },
                lastName: {
                  type: 'string',
                  example: 'Doe',
                },
                age: {
                  type: 'number',
                  example: 30,
                },
                isRightHanded: {
                  type: 'boolean',
                  example: true,
                },
                role: {
                  type: 'string',
                  example: 'user',
                },
                id: {
                  type: 'string',
                  example: 'cb00fcba-f592-4451-adb0-557d34a42623',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-15T05:21:13.511Z',
                },
              },
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticación',
              example:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVtYWlsQGdtYWlsLmNvbSIsInN1YiI6ImNiMDBmY2JhLWY1OTItNDQ1MS1hZGIwLTU1N2QzNGE0MjYyMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU3OTAyODczLCJleHAiOjE3NTc5NDYwNzN9.Jz7NaZbT0N5WXWprZp7GLmHZrYZTeGUiK-sWg7xjSrg',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            'email must be an email',
            'firstName should not be empty',
            'lastName should not be empty',
            'age must not be less than 0',
            'age must be an integer number',
          ],
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
        statusCode: {
          type: 'number',
          example: 400,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está en uso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email already in use',
        },
        error: {
          type: 'string',
          example: 'Conflict',
        },
        statusCode: {
          type: 'number',
          example: 409,
        },
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.role = 'user';
    const user = await this.authService.registerUser(createUserDto);
    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  @Public()
  @Post('login/')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve un token JWT',
  })
  @ApiBody({
    type: LoginUserDto,
    description: 'Credenciales de acceso del usuario',
    examples: {
      example1: {
        summary: 'Ejemplo de login',
        description: 'Credenciales de ejemplo para iniciar sesión',
        value: {
          email: 'email@gmail.com',
          password: 'hashedPassword',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User logged in successfully',
        },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'cb00fcba-f592-4451-adb0-557d34a42623',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'email@gmail.com',
                },
                firstName: {
                  type: 'string',
                  example: 'John',
                },
                lastName: {
                  type: 'string',
                  example: 'Doe',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-15T05:21:13.511Z',
                },
                age: {
                  type: 'number',
                  example: 30,
                },
                isRightHanded: {
                  type: 'boolean',
                  example: true,
                },
                role: {
                  type: 'string',
                  example: 'user',
                },
              },
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticación',
              example:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVtYWlsQGdtYWlsLmNvbSIsInN1YiI6ImNiMDBmY2JhLWY1OTItNDQ1MS1hZGIwLTU1N2QzNGE0MjYyMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU3OTA0MTA4LCJleHAiOjE3NTc5NDczMDh9.QEoNxsC8Q9v0aLcQE0GC2vEgcPTOadlFOksbGiN7zrA',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['email must be a string', 'password must be a string'],
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
        statusCode: {
          type: 'number',
          example: 400,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email o contraseña incorrectos',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid credentials',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  async login(@Body() user: LoginUserDto) {
    const token = await this.authService.login(user);
    return {
      message: 'User logged in successfully',
      data: token,
    };
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar reset de contraseña',
    description:
      'Envía un enlace de restablecimiento de contraseña al email del usuario',
  })
  @ApiBody({
    type: ResetPassword,
    description: 'Email del usuario para enviar el enlace de reset',
    examples: {
      example1: {
        summary: 'Ejemplo de reset de contraseña',
        description: 'Email de ejemplo para solicitar reset de contraseña',
        value: {
          email: 'email@gmail.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Enlace de reset enviado (si el email existe)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If the email exists, a reset link has been sent.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email inválido o formato incorrecto',
  })
  async requestPasswordReset(@Body() resetPasswordDto: ResetPassword) {
    const { email } = resetPasswordDto;
    await this.authService.sendPasswordResetToken(email);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('password/reset/confirm')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Confirmar reset de contraseña',
    description:
      'Establece una nueva contraseña usando el token de reset recibido por email',
  })
  @ApiBody({
    type: ConfirmResetPasswordDto,
    description: 'Token de reset y nueva contraseña',
    examples: {
      example1: {
        summary: 'Ejemplo de confirmación de reset',
        description: 'Token y nueva contraseña para confirmar el reset',
        value: {
          newPassword: 'email@gmail.com',
          token: 'token-que-se-genera-en-el-email',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password has been successfully reset.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
        },
        message: {
          type: 'string',
          example: 'Invalid token',
        },
      },
    },
  })
  async confirmPasswordReset(
    @Body() confirmResetPasswordDto: ConfirmResetPasswordDto,
  ) {
    const { token, newPassword } = confirmResetPasswordDto;
    try {
      await this.authService.resetPassword(token, newPassword);
      return { message: 'Password has been successfully reset.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 500,
    description: 'Error en la configuración de OAuth',
  })
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const payload = req.user;
    if (!payload) {
      throw new HttpException('No user data found', HttpStatus.UNAUTHORIZED);
    }
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(302, `${frontendUrl}/login?token=${payload.access_token}`);
  }
}
