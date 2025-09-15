import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { createReadStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { lookup } from 'mime-types';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { IsString } from 'class-validator';

export class UploadImageDto {
  @IsString()
  id: string;
}

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly uploadPictureUseCase: UploadPictureUseCase) {}
  private readonly allowedExtensions = ['png', 'jpeg', 'jpg', 'webp'];

  @Public()
  @Get(':folder/:filename')
  @ApiOperation({
    summary: 'Obtener imagen',
    description: 'Obtiene una imagen desde el sistema de archivos con diferentes tamaños disponibles',
  })
  @ApiParam({
    name: 'folder',
    description: 'Carpeta donde se encuentra la imagen',
    example: 'language',
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre del archivo de imagen (sin extensión)',
    example: '56aa0d68-bcd7-4448-817a-657f1732a8fb',
  })
  @ApiQuery({
    name: 'size',
    description: 'Tamaño de la imagen a obtener',
    enum: ['original', 'sm', 'md', 'lg'],
    required: false,
    example: 'original',
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 404,
    description: 'Imagen no encontrada',
  })
  getImage(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Query('size') size: 'original' | 'sm' | 'md' | 'lg' = 'original',
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const basePath = join(process.cwd(), 'uploads');
    const id = filename;
    const fileBaseName =
      size === 'original' ? `${id}-original` : `${id}-${size}`;

    let filePath: string | null = null;
    let foundExt: string | null = null;

    for (const ext of this.allowedExtensions) {
      const tryPath = resolve(basePath, folder, `${fileBaseName}.${ext}`);
      if (tryPath.startsWith(basePath) && existsSync(tryPath)) {
        filePath = tryPath;
        foundExt = ext;
        break;
      }
    }

    if (!filePath || !foundExt) {
      throw new NotFoundException('Image not found');
    }

    const mimeType = lookup(foundExt) || 'application/octet-stream';
    const fileStream = createReadStream(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileBaseName}.${foundExt}"`,
    });

    return new StreamableFile(fileStream);
  }

  @Public()
  @Post('upload/:folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir imagen',
    description: 'Sube una imagen y genera diferentes tamaños (sm, md, lg, original). El formato se detecta automáticamente del archivo.',
  })
  @ApiParam({
    name: 'folder',
    description: 'Carpeta de destino donde se guardará la imagen',
    example: 'language',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o formato de imagen no soportado',
  })
  async uploadPicture(
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ): Promise<string[]> {
    const { id } = body;
    return await this.uploadPictureUseCase.execute(id, folder, file);
  }
}
