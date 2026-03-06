import { applyDecorators } from '@nestjs/common';
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
      description: 'Crea una nueva cuenta de usuario en el sistema',
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
    ApiResponse({
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
    }),
  );
};

export const DocLogin = () => {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({
      summary: 'Iniciar sesión',
      description: 'Autentica un usuario y devuelve un token JWT',
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

import { HttpCode } from '@nestjs/common';
