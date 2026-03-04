import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

export const DocLanguage = () => applyDecorators(ApiTags('Languages'));

export const DocCreateLanguage = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Crear un nuevo lenguaje de señas',
            description:
                'Crea un nuevo lenguaje de señas con nombre, descripción y código de país. El código de país se puede obtener del endpoint /region/countries. Solo accesible para administradores.',
        }),
        ApiBody({
            description: 'Datos del lenguaje de señas a crear',
            schema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nombre del lenguaje de señas',
                        example: 'Lenguaje de señas Colombiano',
                    },
                    description: {
                        type: 'string',
                        description: 'Descripción del lenguaje de señas',
                        example:
                            'El sistema de comunicación visual usado por la comunidad sorda.',
                    },
                    countryCode: {
                        type: 'string',
                        description:
                            'Código ISO del país (opcional). Se puede obtener del endpoint /region/countries',
                        example: 'CO',
                    },
                },
                required: ['name', 'description'],
            },
        }),
        ApiResponse({
            status: 201,
            description: 'Lenguaje creado exitosamente',
            schema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        example: '35931093-952c-44ae-803e-b26d0e72dd24',
                    },
                    name: {
                        type: 'string',
                        example: 'Lenguaje de señas Colombiano',
                    },
                    description: {
                        type: 'string',
                        example:
                            'El sistema de comunicación visual usado por la comunidad sorda.',
                    },
                    countryCode: {
                        type: 'string',
                        example: 'CO',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-18T22:12:52.512Z',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-18T22:12:52.512Z',
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Datos de entrada inválidos',
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado',
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado - Se requiere rol de administrador',
        }),
    );
};

export const DocListLanguages = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Listar todos los lenguajes de señas',
            description:
                'Obtiene una lista paginada de todos los lenguajes de señas disponibles en el sistema.',
        }),
        ApiQuery({
            name: 'page',
            description: 'Número de página (comienza en 1)',
            example: 1,
            required: false,
        }),
        ApiQuery({
            name: 'limit',
            description: 'Número de elementos por página',
            example: 100,
            required: false,
        }),
        ApiQuery({
            name: 'orderBy',
            description: 'Campo por el cual ordenar los resultados',
            example: 'name',
            required: false,
        }),
        ApiQuery({
            name: 'sortOrder',
            description: 'Orden de clasificación (ASC o DESC)',
            example: 'ASC',
            enum: ['ASC', 'DESC'],
            required: false,
        }),
        ApiResponse({
            status: 200,
            description: 'Lista de lenguajes obtenida exitosamente',
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
                                    example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
                                },
                                name: {
                                    type: 'string',
                                    example: 'Lenguaje de señas Chileno',
                                },
                                description: {
                                    type: 'string',
                                    example: 'Lenguaje de sena de chile',
                                },
                                countryCode: {
                                    type: 'string',
                                    nullable: true,
                                    example: 'CL',
                                },
                                createdAt: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2025-09-12T04:20:16.738Z',
                                },
                                updatedAt: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2025-09-12T05:12:03.566Z',
                                },
                            },
                        },
                        example: [
                            {
                                id: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
                                name: 'Lenguaje de señas Chileno',
                                description: 'Lenguaje de sena de chile',
                                countryCode: 'CL',
                                createdAt: '2025-09-12T04:20:16.738Z',
                                updatedAt: '2025-09-12T05:12:03.566Z',
                            },
                            {
                                id: '35931093-952c-44ae-803e-b26d0e72dd24',
                                name: 'Lenguaje de señas Colombiano',
                                description:
                                    'El sistema de comunicación visual usado por la comunidad sorda.',
                                countryCode: 'CO',
                                createdAt: '2025-09-18T22:12:52.512Z',
                                updatedAt: '2025-09-18T22:12:52.512Z',
                            },
                            {
                                id: '140e9331-e7ca-495f-9f74-c471d685d91a',
                                name: 'Lenguaje de señas Mexicano',
                                description: 'lenguaje de senia de mexico',
                                countryCode: null,
                                createdAt: '2025-09-12T05:14:31.116Z',
                                updatedAt: '2025-09-12T05:14:31.116Z',
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
                    },
                    total: {
                        type: 'number',
                        description: 'Total de lenguajes disponibles',
                        example: 4,
                    },
                    page: {
                        type: 'number',
                        description: 'Página actual',
                        example: 1,
                    },
                    pageSize: {
                        type: 'number',
                        description: 'Tamaño de la página',
                        example: 100,
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado - Token JWT requerido',
        }),
    );
};

export const DocGetLanguage = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Obtener un lenguaje por ID',
            description:
                'Obtiene los detalles de un lenguaje de señas específico por su ID. Solo accesible para administradores.',
        }),
        ApiResponse({
            status: 200,
            description: 'Lenguaje encontrado exitosamente',
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado',
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado - Se requiere rol de administrador',
        }),
        ApiResponse({
            status: 404,
            description: 'Lenguaje no encontrado',
        }),
    );
};

export const DocUpdateLanguage = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Actualizar un lenguaje de señas',
            description:
                'Actualiza los datos de un lenguaje de señas existente. Solo accesible para administradores.',
        }),
        ApiBody({
            description: 'Datos del lenguaje de señas a actualizar',
            schema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nombre del lenguaje de señas',
                        example: 'Lenguaje de señas Argentino',
                    },
                    description: {
                        type: 'string',
                        description: 'Descripción del lenguaje de señas',
                        example:
                            'El sistema de comunicación visual usado por la comunidad sorda.',
                    },
                    countryCode: {
                        type: 'string',
                        description:
                            'Código ISO del país (opcional). Se puede obtener del endpoint /region/countries',
                        example: 'AR',
                    },
                },
                required: ['name', 'description'],
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Lenguaje actualizado exitosamente',
            schema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        example: 'fc36a7cf-c448-46c1-a191-2ceb5c60a3b4',
                    },
                    name: {
                        type: 'string',
                        example: 'Lenguaje de señas Argentino',
                    },
                    description: {
                        type: 'string',
                        example:
                            'El sistema de comunicación visual usado por la comunidad sorda.',
                    },
                    countryCode: {
                        type: 'string',
                        example: 'AR',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-11T04:27:29.233Z',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-20T00:19:23.000Z',
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Datos de entrada inválidos',
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado',
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado - Se requiere rol de administrador',
        }),
        ApiResponse({
            status: 404,
            description: 'Lenguaje no encontrado',
        }),
    );
};

export const DocRemoveLanguage = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Eliminar un lenguaje de señas',
            description:
                'Elimina permanentemente un lenguaje de señas del sistema. Solo accesible para administradores.',
        }),
        ApiResponse({
            status: 204,
            description:
                'Lenguaje eliminado exitosamente - Sin contenido en la respuesta',
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado - Token JWT requerido',
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado - Se requiere rol de administrador',
        }),
        ApiResponse({
            status: 404,
            description: 'Lenguaje no encontrado - El ID proporcionado no existe',
        }),
    );
};

export const DocGetStagesByLanguage = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Obtener etapas de un lenguaje',
            description:
                'Obtiene las etapas asociadas a un lenguaje de señas específico. Solo accesible para administradores.',
        }),
        ApiQuery({
            name: 'id',
            description: 'ID del lenguaje de señas',
            example: '49d5adb5-50f0-40e1-aa32-ffee377d1542',
            required: true,
        }),
        ApiResponse({
            status: 200,
            description: 'Etapas obtenidas exitosamente',
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
                                    example: '0ece0b95-bdc0-49ab-8eb8-9067a4a6afdb',
                                },
                                name: {
                                    type: 'string',
                                    example: 'B I',
                                },
                                description: {
                                    type: 'string',
                                    example:
                                        'Puede desenvolverse en situaciones comunes usando lenguaje de señas con fluidez básica',
                                },
                            },
                        },
                        example: [
                            {
                                id: '0ece0b95-bdc0-49ab-8eb8-9067a4a6afdb',
                                name: 'B I',
                                description:
                                    'Puede desenvolverse en situaciones comunes usando lenguaje de señas con fluidez básica',
                            },
                            {
                                id: '111450c9-a3db-4472-98f5-5ee0935f4742',
                                name: 'C II',
                                description:
                                    'Puede expresarse espontáneamente en lenguaje de señas con gran precisión y matices sutiles',
                            },
                            {
                                id: '1f0e722c-2e2b-45e5-8916-e242664bf37d',
                                name: 'A I',
                                description:
                                    'Puede utilizar señas básicas para comunicarse en tareas sencillas y rutinarias',
                            },
                            {
                                id: 'd937b359-d7d6-46ea-a457-a453610be8b0',
                                name: 'A II',
                                description:
                                    'Puede comprender señas frecuentes relacionadas con áreas de experiencia relevantes',
                            },
                            {
                                id: 'fcef7675-7b94-435e-bc66-3f2055d40838',
                                name: 'B II',
                                description:
                                    'Puede interactuar con usuarios nativos de lenguaje de señas con fluidez y naturalidad',
                            },
                            {
                                id: 'fecb82ca-9ac5-4c7c-b64c-3296197058fe',
                                name: 'C I',
                                description:
                                    'Puede comprender señas complejas y expresarse con claridad y estructura',
                            },
                        ],
                    },
                    total: {
                        type: 'number',
                        description: 'Total de etapas disponibles',
                        example: 6,
                    },
                    page: {
                        type: 'number',
                        description: 'Página actual',
                        example: 1,
                    },
                    pageSize: {
                        type: 'number',
                        description: 'Tamaño de la página',
                        example: 10,
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado - Token JWT requerido',
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado - Se requiere rol de administrador',
        }),
        ApiResponse({
            status: 404,
            description: 'Lenguaje no encontrado - El ID proporcionado no existe',
        }),
    );
};

export const DocGetQuizzes = () => {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Obtener quizzes de un lenguaje',
            description:
                'Obtiene los quizzes asociados a un lenguaje de señas específico. Requiere autenticación JWT. Ejemplo: GET /languages/49d5adb5-50f0-40e1-aa32-ffee377d1542/quizzes',
        }),
        ApiQuery({
            name: 'page',
            description: 'Número de página (comienza en 1)',
            example: 1,
            required: false,
        }),
        ApiQuery({
            name: 'limit',
            description: 'Número de elementos por página',
            example: 100,
            required: false,
        }),
        ApiQuery({
            name: 'sortOrder',
            description: 'Orden de clasificación (ASC o DESC)',
            example: 'ASC',
            enum: ['ASC', 'DESC'],
            required: false,
        }),
        ApiResponse({
            status: 200,
            description: 'Quizzes obtenidos exitosamente',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '0bf9dd86-8193-4404-9804-583fb77c8d01',
                        },
                        lesson: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    format: 'uuid',
                                    example: '693df282-93dd-4ed8-91e3-09893d5ac879',
                                },
                                createdAt: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2025-09-20T00:20:12.352Z',
                                },
                                updatedAt: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2025-09-20T00:20:12.352Z',
                                },
                                name: {
                                    type: 'string',
                                    example: 'El abecedario',
                                },
                                description: {
                                    type: 'string',
                                    example: 'El abecedario de la A a la Z',
                                },
                                content: {
                                    type: 'string',
                                    example: 'A,B,C ... , X,Y,Z',
                                },
                                language: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'string',
                                            format: 'uuid',
                                            example: '49d5adb5-50f0-40e1-aa32-ffee377d1542',
                                        },
                                        name: {
                                            type: 'string',
                                            example: 'Lenguaje de señas Venezolano',
                                        },
                                        description: {
                                            type: 'string',
                                            example:
                                                'El sistema de comunicación visual usado por la comunidad sorda',
                                        },
                                        countryCode: {
                                            type: 'string',
                                            nullable: true,
                                            example: 'VE',
                                        },
                                        createdAt: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2025-09-20T00:20:12.221Z',
                                        },
                                        updatedAt: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2025-09-20T00:20:12.221Z',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                example: [
                    {
                        id: '0bf9dd86-8193-4404-9804-583fb77c8d01',
                        lesson: {
                            id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                            createdAt: '2025-09-20T00:20:12.352Z',
                            updatedAt: '2025-09-20T00:20:12.352Z',
                            name: 'El abecedario',
                            description: 'El abecedario de la A a la Z',
                            content: 'A,B,C ... , X,Y,Z',
                            language: {
                                id: '49d5adb5-50f0-40e1-aa32-ffee377d1542',
                                name: 'Lenguaje de señas Venezolano',
                                description:
                                    'El sistema de comunicación visual usado por la comunidad sorda',
                                countryCode: 'VE',
                                createdAt: '2025-09-20T00:20:12.221Z',
                                updatedAt: '2025-09-20T00:20:12.221Z',
                            },
                        },
                    },
                    {
                        id: '28fa7d35-c91c-4a33-8244-5c0adcac265b',
                        lesson: {
                            id: '693df282-93dd-4ed8-91e3-09893d5ac879',
                            createdAt: '2025-09-20T00:20:12.352Z',
                            updatedAt: '2025-09-20T00:20:12.352Z',
                            name: 'El abecedario',
                            description: 'El abecedario de la A a la Z',
                            content: 'A,B,C ... , X,Y,Z',
                            language: {
                                id: '49d5adb5-50f0-40e1-aa32-ffee377d1542',
                                name: 'Lenguaje de señas Venezolano',
                                description:
                                    'El sistema de comunicación visual usado por la comunidad sorda',
                                countryCode: 'VE',
                                createdAt: '2025-09-20T00:20:12.221Z',
                                updatedAt: '2025-09-20T00:20:12.221Z',
                            },
                        },
                    },
                ],
            },
        }),
        ApiResponse({
            status: 401,
            description:
                'No autorizado - Token JWT requerido. Incluir header: Authorization: Bearer {token}',
        }),
        ApiResponse({
            status: 404,
            description: 'Lenguaje no encontrado - El ID proporcionado no existe',
        }),
    );
};
