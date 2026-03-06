import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

export const DocImages = () => applyDecorators(ApiTags('Images'));

export const DocGetImage = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener imagen',
      description:
        'Obtiene una imagen desde el sistema de archivos con diferentes tamaños disponibles',
    }),
    ApiParam({
      name: 'folder',
      description: 'Carpeta donde se encuentra la imagen',
      example: 'language',
    }),
    ApiParam({
      name: 'filename',
      description: 'Nombre del archivo de imagen (sin extensión)',
      example: '56aa0d68-bcd7-4448-817a-657f1732a8fb',
    }),
    ApiQuery({
      name: 'size',
      description: 'Tamaño de la imagen a obtener',
      enum: ['original', 'sm', 'md', 'lg'],
      required: false,
      example: 'original',
    }),
    ApiResponse({
      status: 200,
      description: 'Imagen obtenida exitosamente',
      content: {
        'image/png': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
        'image/jpeg': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
        'image/webp': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Imagen no encontrada',
    }),
  );
};

export const DocUploadPicture = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Subir imagen',
      description:
        'Sube una imagen y genera diferentes tamaños (sm, md, lg, original). El formato se detecta automáticamente del archivo.',
    }),
    ApiParam({
      name: 'folder',
      description: 'Carpeta de destino donde se guardará la imagen',
      example: 'language',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Datos para subir la imagen',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Archivo de imagen a subir',
          },
          id: {
            type: 'string',
            description: 'Identificador único para la imagen',
            example: '56aa0d68-bcd7-4448-817a-657f1732a8fb',
          },
        },
        required: ['file', 'id'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Imagen subida exitosamente',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
        example: [
          '/images/language/56aa0d68-bcd7-4448-817a-657f1732a8fb?size=original',
          '/images/language/56aa0d68-bcd7-4448-817a-657f1732a8fb?size=sm',
          '/images/language/56aa0d68-bcd7-4448-817a-657f1732a8fb?size=md',
          '/images/language/56aa0d68-bcd7-4448-817a-657f1732a8fb?size=lg',
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos de entrada inválidos o formato de imagen no soportado',
    }),
  );
};
