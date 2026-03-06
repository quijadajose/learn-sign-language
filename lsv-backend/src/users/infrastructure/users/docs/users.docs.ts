import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserDto } from 'src/auth/domain/dto/update-user/update-user';
import { EnrollUserInLanguageDto } from '../enroll-user-in-language.dto';

export const DocUsers = () => applyDecorators(ApiTags('Usuarios'));

export const DocUserProfile = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener perfil del usuario autenticado',
      description:
        'Retorna la información del perfil del usuario actualmente autenticado',
    }),
    ApiResponse({
      status: 200,
      description: 'Perfil del usuario obtenido exitosamente',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          age: { type: 'number' },
          isRightHanded: { type: 'boolean' },
          role: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          id: 'cb00fcba-f592-4451-adb0-557d34a42623',
          email: 'email@gmail.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2025-09-15T05:21:13.511Z',
          age: 30,
          isRightHanded: true,
          role: 'user',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
  );
};

export const DocUpdateProfile = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Actualizar perfil del usuario autenticado',
      description:
        'Permite actualizar la información del perfil del usuario actualmente autenticado',
    }),
    ApiBody({
      type: UpdateUserDto,
      description: 'Datos del usuario a actualizar',
      examples: {
        'actualizacion-basica': {
          summary: 'Actualización básica de perfil',
          description: 'Ejemplo de actualización sin cambiar contraseña',
          value: {
            email: 'email@gmail.com',
            googleId: 'newGoogleId123',
            firstName: 'John',
            lastName: 'Doe',
            age: 25,
            isRightHanded: true,
            role: 'admin',
          },
        },
        'cambio-contraseña': {
          summary: 'Actualización con cambio de contraseña',
          description:
            'Ejemplo de actualización incluyendo cambio de contraseña',
          value: {
            email: 'email@gmail.com',
            googleId: 'newGoogleId123',
            oldPassword: 'hashedPassword',
            newPassword: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            age: 25,
            isRightHanded: true,
            role: 'admin',
          },
        },
      },
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Nuevo email del usuario',
          },
          googleId: {
            type: 'string',
            description: 'Nuevo Google ID del usuario',
          },
          firstName: {
            type: 'string',
            description: 'Nuevo nombre del usuario',
          },
          lastName: {
            type: 'string',
            description: 'Nuevo apellido del usuario',
          },
          age: {
            type: 'number',
            minimum: 0,
            description: 'Nueva edad del usuario',
          },
          isRightHanded: {
            type: 'boolean',
            description: 'Si el usuario es diestro',
          },
          role: {
            type: 'string',
            description: 'Rol del usuario (se ignora en la actualización)',
          },
          oldPassword: {
            type: 'string',
            description:
              'Contraseña actual (requerida para cambiar contraseña)',
          },
          newPassword: { type: 'string', description: 'Nueva contraseña' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Perfil del usuario actualizado exitosamente',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          age: { type: 'number' },
          isRightHanded: { type: 'boolean' },
          role: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          id: 'cb00fcba-f592-4451-adb0-557d34a42623',
          email: 'email@gmail.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2025-09-15T05:21:13.511Z',
          age: 25,
          isRightHanded: true,
          role: 'user',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos o contraseña actual incorrecta',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' },
          statusCode: { type: 'number' },
        },
        example: {
          message: 'Current password does not match',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
  );
};

export const DocListLanguages = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener lista de idiomas disponibles',
      description:
        'Retorna una lista paginada de todos los idiomas disponibles en el sistema',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description:
        'Número de elementos por página (por defecto: 10, máximo: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      type: String,
      description: 'Campo por el cual ordenar los resultados',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Orden de clasificación (por defecto: DESC)',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de idiomas obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string' },
                countryCode: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          total: { type: 'number', description: 'Total de idiomas' },
          page: { type: 'number', description: 'Página actual' },
          pageSize: { type: 'number', description: 'Tamaño de la página' },
        },
        example: {
          data: [
            {
              id: '140e9331-e7ca-495f-9f74-c471d685d91a',
              name: 'Lenguaje de señas Mexicano',
              description: 'lenguaje de señas de mexico',
              countryCode: null,
              createdAt: '2025-09-12T05:14:31.116Z',
              updatedAt: '2025-09-12T05:14:31.116Z',
            },
            {
              id: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
              name: 'Lenguaje de señas Chileno',
              description: 'Lenguaje de sena de chile',
              countryCode: 'CL',
              createdAt: '2025-09-12T04:20:16.738Z',
              updatedAt: '2025-09-12T05:12:03.566Z',
            },
            {
              id: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
              name: 'Lenguaje de señas Venezolano',
              description:
                'El sistema de comunicación visual usado por la comunidad sorda',
              countryCode: 'VE',
              createdAt: '2025-09-11T04:27:29.233Z',
              updatedAt: '2025-09-12T05:12:03.571Z',
            },
          ],
          total: 3,
          page: 1,
          pageSize: 10,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description:
        'No autorizado - Token JWT inválido, expirado o no proporcionado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' },
          statusCode: { type: 'number' },
        },
        example: {
          message: 'No token provided',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
  );
};

export const DocGetLanguage = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiSecurity('admin'),
    ApiOperation({
      summary: 'Obtener idioma por ID (Solo Administradores)',
      description:
        'Retorna la información de un idioma específico por su ID. Requiere rol de administrador.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'ID único del idioma',
      example: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
    }),
    ApiResponse({
      status: 200,
      description: 'Idioma obtenido exitosamente',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', description: 'Nombre del idioma' },
          description: {
            type: 'string',
            description: 'Descripción del idioma',
          },
          countryCode: {
            type: 'string',
            nullable: true,
            description: 'Código del país',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: {
          id: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
          name: 'Lenguaje de señas Venezolano',
          description:
            'El sistema de comunicación visual usado por la comunidad sorda',
          countryCode: 'VE',
          createdAt: '2025-09-11T04:27:29.233Z',
          updatedAt: '2025-09-12T05:12:03.571Z',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Idioma no encontrado' }),
    ApiResponse({
      status: 400,
      description: 'ID inválido - formato UUID requerido',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Se requiere rol de administrador',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' },
          statusCode: { type: 'number' },
        },
        example: {
          message: 'Forbidden resource',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
  );
};

export const DocGetLessonById = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener lección por ID',
      description:
        'Retorna la información completa de una lección específica por su ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'ID único de la lección',
      example: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
    }),
    ApiResponse({
      status: 200,
      description: 'Lección obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', description: 'Título de la lección' },
          description: {
            type: 'string',
            description: 'Descripción de la lección',
          },
          languageId: {
            type: 'string',
            format: 'uuid',
            description: 'ID del idioma',
          },
          content: { type: 'string', description: 'Contenido de la lección' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Lección no encontrada' }),
    ApiResponse({
      status: 400,
      description: 'ID inválido - formato UUID requerido',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
  );
};

export const DocFindUserLanguages = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener idiomas inscritos del usuario',
      description:
        'Retorna una lista paginada de los idiomas en los que el usuario autenticado está inscrito, incluyendo las regiones enroladas para cada idioma',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description:
        'Número de elementos por página (por defecto: 10, máximo: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      type: String,
      description: 'Campo por el cual ordenar los resultados',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Orden de clasificación (por defecto: DESC)',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de idiomas inscritos obtenida exitosamente con sus regiones enroladas',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  format: 'uuid',
                  example: '5319d099-5c98-48ce-b44d-dbe273196d30',
                },
                languageId: {
                  type: 'string',
                  format: 'uuid',
                  example: '140e9331-e7ca-495f-9f74-c471d685d91a',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-13T00:30:40.143Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-13T00:30:40.143Z',
                },
                language: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      example: '140e9331-e7ca-495f-9f74-c471d685d91a',
                    },
                    name: {
                      type: 'string',
                      example: 'Lenguaje de señas Mexicano',
                    },
                    description: {
                      type: 'string',
                      example: 'lenguaje de señas de mexico',
                    },
                    countryCode: { type: 'string', example: 'MX' },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-09-12T05:14:31.116Z',
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-09-12T05:14:31.116Z',
                    },
                  },
                },
                enrolledRegions: {
                  type: 'array',
                  description: 'Array de regiones enroladas para este idioma',
                  items: {
                    type: 'object',
                    properties: {
                      userId: {
                        type: 'string',
                        format: 'uuid',
                        example: '5319d099-5c98-48ce-b44d-dbe273196d30',
                      },
                      regionId: {
                        type: 'string',
                        format: 'uuid',
                        example: '250e9331-e7ca-495f-9f74-c471d685d91b',
                      },
                      createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-13T00:30:40.143Z',
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-13T00:30:40.143Z',
                      },
                      region: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string',
                            format: 'uuid',
                            example: '250e9331-e7ca-495f-9f74-c471d685d91b',
                          },
                          name: { type: 'string', example: 'Ciudad de México' },
                          code: { type: 'string', example: 'CDMX' },
                          description: {
                            type: 'string',
                            example: 'Región de Ciudad de México',
                          },
                          isDefault: { type: 'boolean', example: true },
                          languageId: {
                            type: 'string',
                            format: 'uuid',
                            example: '140e9331-e7ca-495f-9f74-c471d685d91a',
                          },
                          createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-09-12T05:14:31.116Z',
                          },
                          updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-09-12T05:14:31.116Z',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          total: { type: 'number', description: 'Total de idiomas inscritos' },
          page: { type: 'number', description: 'Página actual' },
          pageSize: { type: 'number', description: 'Tamaño de la página' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
  );
};

export const DocEnroll = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Inscribir usuario en un idioma',
      description:
        'Permite al usuario autenticado inscribirse en un idioma específico',
    }),
    ApiBody({
      type: EnrollUserInLanguageDto,
      description: 'Datos de inscripción en el idioma',
      schema: {
        type: 'object',
        required: ['languageId'],
        properties: {
          languageId: {
            type: 'string',
            format: 'uuid',
            description: 'ID único del idioma en el que se desea inscribir',
            example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
          },
          regionId: {
            type: 'string',
            format: 'uuid',
            description: 'ID único de la región (opcional)',
            example: '8dc31a49-64ae-4c94-b867-d818ce9441e7',
          },
        },
        example: {
          languageId: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
          regionId: '8dc31a49-64ae-4c94-b867-d818ce9441e7',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario inscrito exitosamente en el idioma',
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            example: '5319d099-5c98-48ce-b44d-dbe273196d30',
          },
          languageId: {
            type: 'string',
            format: 'uuid',
            example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
          },
        },
        example: {
          userId: '5319d099-5c98-48ce-b44d-dbe273196d30',
          languageId: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos de entrada inválidos o usuario ya inscrito en el idioma',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Idioma no encontrado',
    }),
  );
};

export const DocGetStagesProgress = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener progreso de etapas por idioma',
      description:
        'Retorna el progreso del usuario autenticado en las diferentes etapas de un idioma específico',
    }),
    ApiParam({
      name: 'languageId',
      type: 'string',
      format: 'uuid',
      description: 'ID único del idioma',
      example: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description:
        'Número de elementos por página (por defecto: 10, máximo: 100)',
      example: 100,
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Orden de clasificación (por defecto: DESC)',
      example: 'ASC',
    }),
    ApiResponse({
      status: 200,
      description: 'Progreso de etapas obtenido exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'b01fab95-1d2e-43b1-99aa-20fd4afbf5e1',
                },
                name: { type: 'string', example: 'A I' },
                description: {
                  type: 'string',
                  example:
                    'Puede utilizar señas básicas para comunicarse en tareas sencillas y rutinarias',
                },
                totalLessons: { type: 'string', example: '2' },
                completedLessons: { type: 'string', example: '1' },
                progress: { type: 'string', nullable: true, example: '50.00' },
              },
            },
          },
          total: { type: 'number', description: 'Total de etapas' },
          page: { type: 'number', description: 'Página actual' },
          pageSize: { type: 'number', description: 'Tamaño de la página' },
        },
        example: {
          data: [
            {
              id: 'b01fab95-1d2e-43b1-99aa-20fd4afbf5e1',
              name: 'A I',
              description:
                'Puede utilizar señas básicas para comunicarse en tareas sencillas y rutinarias',
              totalLessons: '2',
              completedLessons: '1',
              progress: '50.00',
            },
            {
              id: '113155d1-a897-49a7-afde-568b2281bc8a',
              name: 'A II',
              description:
                'Puede comprender señas frecuentes relacionadas con áreas de experiencia relevantes',
              totalLessons: '0',
              completedLessons: '0',
              progress: null,
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Idioma no encontrado o usuario no inscrito en el idioma',
    }),
    ApiResponse({
      status: 400,
      description: 'ID inválido - formato UUID requerido',
    }),
  );
};

export const DocFindUserRegions = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener regiones inscritas del usuario',
      description:
        'Retorna una lista paginada de las regiones en las que el usuario autenticado está inscrito',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description:
        'Número de elementos por página (por defecto: 10, máximo: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'languageId',
      required: false,
      type: String,
      format: 'uuid',
      description: 'ID del idioma para filtrar regiones (opcional)',
      example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      type: String,
      description: 'Campo por el cual ordenar los resultados',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Orden de clasificación (por defecto: DESC)',
    }),
    ApiResponse({
      status: 200,
      description: 'Regiones inscritas obtenidas exitosamente',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
  );
};

export const DocEnrollRegion = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Inscribir usuario en una región',
      description:
        'Permite al usuario autenticado inscribirse en una región específica',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['regionId'],
        properties: {
          regionId: {
            type: 'string',
            format: 'uuid',
            description: 'ID único de la región en la que se desea inscribir',
            example: '8dc31a49-64ae-4c94-b867-d818ce9441e7',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario inscrito exitosamente en la región',
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos de entrada inválidos o usuario ya inscrito en la región',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Región no encontrada',
    }),
  );
};

export const DocUnenrollFromLanguage = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Desinscribirse de un idioma',
      description:
        'Permite al usuario autenticado desinscribirse de un idioma. No se puede desinscribir del último idioma.',
    }),
    ApiParam({
      name: 'languageId',
      type: String,
      format: 'uuid',
      description: 'ID del idioma del que se desea desinscribirse',
      example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario desinscrito exitosamente del idioma',
    }),
    ApiResponse({
      status: 400,
      description:
        'No se puede desinscribir del último idioma. Debes tener al menos un idioma inscrito.',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Idioma no encontrado o no estás inscrito en este idioma',
    }),
  );
};

export const DocUnenrollFromRegion = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Desinscribirse de una región',
      description:
        'Permite al usuario autenticado desinscribirse de una región específica',
    }),
    ApiParam({
      name: 'regionId',
      type: String,
      format: 'uuid',
      description: 'ID de la región de la que se desea desinscribirse',
      example: '8dc31a49-64ae-4c94-b867-d818ce9441e7',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario desinscrito exitosamente de la región',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token JWT inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Región no encontrada o no estás inscrito en esta región',
    }),
  );
};
