import { applyDecorators, HttpCode } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { CreateUserDto } from '../../domain/dto/create-user/create-user';
import { LoginUserDto } from '../../../auth/application/dto/login-user/login-user';
import { ResetPassword } from '../../../auth/application/dto/reset-password/reset-password';
import { ConfirmResetPasswordDto } from '../../../auth/application/dto/confirm-reset-password/confirm-reset-password-dto';

export const DocAuth = () => applyDecorators(ApiTags('Authentication'));

export const DocRegister = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar nuevo usuario',
      description:
        'Crea una cuenta. El email duplicado responde igual (201) para no enumerar cuentas. No emite JWT; hay que iniciar sesión.',
    }),
    ApiBody({
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
    }),
    ApiResponse({
      status: 201,
      description:
        'Usuario registrado exitosamente (también si el email ya existía)',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User registered successfully',
          },
        },
      },
    }),
    ApiResponse({
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
    }),
  );
};

export const DocLogin = () => {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({
      summary: 'Iniciar sesión',
      description:
        'Autentica al usuario, pone el JWT en una cookie httpOnly (`lsv_access`) y devuelve el perfil. El token no va en el JSON.',
    }),
    ApiBody({
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
    }),
    ApiResponse({
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
            },
          },
        },
      },
    }),
    ApiResponse({
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
    }),
    ApiResponse({
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
    }),
  );
};

export const DocLogout = () =>
  applyDecorators(
    HttpCode(200),
    ApiOperation({
      summary: 'Cerrar sesión',
      description:
        'Invalida el JWT actual (sube tokenVersion) y borra la cookie httpOnly.',
    }),
    ApiResponse({
      status: 200,
      description: 'Sesión cerrada',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out' },
        },
      },
    }),
  );

export const DocRequestPasswordReset = () => {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({
      summary: 'Solicitar reset de contraseña',
      description:
        'Envía un enlace de restablecimiento de contraseña al email del usuario',
    }),
    ApiBody({
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
    }),
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Email inválido o formato incorrecto',
    }),
  );
};

export const DocConfirmPasswordReset = () => {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({
      summary: 'Confirmar reset de contraseña',
      description:
        'Establece una nueva contraseña usando el token de reset recibido por email',
    }),
    ApiBody({
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
    }),
    ApiResponse({
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
    }),
    ApiResponse({
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
    }),
  );
};

export const DocGoogleAuth = () => {
  return applyDecorators(
    ApiExcludeEndpoint(),
    ApiResponse({
      status: 500,
      description: 'Error en la configuración de OAuth',
    }),
  );
};

export const DocGoogleAuthRedirect = () => {
  return applyDecorators(ApiExcludeEndpoint());
};

export const DocExchangeGoogleCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Intercambiar código OAuth de Google por sesión',
      description:
        'El frontend envía el `code` del hash `/login#code=...`. La API pone el JWT en la cookie httpOnly; no lo devuelve en el JSON.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['code'],
        properties: {
          code: {
            type: 'string',
            minLength: 16,
            example: 'oauth-one-time-code',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Sesión establecida en cookie httpOnly',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User logged in successfully' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Código inválido o expirado',
    }),
  );
