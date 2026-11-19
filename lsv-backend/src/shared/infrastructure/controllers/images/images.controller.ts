import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { isAbsolute, join, relative, resolve } from 'path';
import { Public } from '../../../../auth/infrastructure/decorators/public.decorator.js';
import { lookup } from 'mime-types';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureUseCase } from '../../../application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import {
  assertImageUploadAllowed,
  SERVER_ID_FOLDERS,
} from '../../../application/image-upload-policy.js';
import { ResourceIdResolver } from '../../../../permissions/infrastructure/guards/resource-access/resource-id-resolver.js';
import {
  IsOptional,
  IsString,
  IsUUID,
  isUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import {
  DocGetImage,
  DocImages,
  DocUploadPicture,
} from './docs/images.docs.js';
import { withI18nParams } from '../../../../i18n/index.js';

export class UploadImageDto {
  /**
   * Recurso dueño de la imagen en `user` (el propio usuario) y `languages` (el idioma).
   * En `lesson` y `quiz` no se acepta: el id de la imagen lo genera el servidor (BE-08).
   */
  @ApiProperty({ format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  /** `lesson`/`quiz`: idioma de la imagen. Alternativa a `lessonId`. */
  @ApiProperty({ format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  languageId?: string;

  /** `lesson`/`quiz`: lección de la que sale el idioma. Alternativa a `languageId`. */
  @ApiProperty({ format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  /**
   * Extensión que manda el admin al subir imágenes de quiz. Se acepta para no
   * romper `forbidNonWhitelisted`, pero se ignora: el formato real sale de los
   * magic bytes en UploadPictureUseCase.
   */
  @ApiProperty({ required: false, example: 'png' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  format?: string;
}

const ALLOWED_UPLOAD_FOLDERS = new Set(['user', 'quiz', 'languages', 'lesson']);

/** True si `target` queda dentro de `base` (no basta un prefijo: `uploads-x` no cuenta). */
function isPathInside(base: string, target: string): boolean {
  const rel = relative(base, target);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/** Lookup mínimo de permisos por idioma; evita importar internals de `moderator` desde `shared`. */
type LanguagePermissionLookup = {
  checkUserPermissionForLanguage(
    userId: string,
    languageId: string,
  ): Promise<boolean>;
};

@DocImages()
@Controller('images')
export class ImagesController {
  constructor(
    private readonly uploadPictureUseCase: UploadPictureUseCase,
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: LanguagePermissionLookup,
    private readonly resourceIdResolver: ResourceIdResolver,
  ) {}
  private readonly allowedExtensions = ['png', 'jpeg', 'jpg', 'webp'];

  @Public()
  @Get(':folder/:filename')
  @DocGetImage()
  getImage(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Query('size') size: 'original' | 'sm' | 'md' | 'lg' = 'original',
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    if (!ALLOWED_UPLOAD_FOLDERS.has(folder) || !isUUID(filename)) {
      throw new NotFoundException('errors.image.notFound');
    }
    const basePath = join(process.cwd(), 'uploads');
    const id = filename;
    const fileBaseName =
      size === 'original' ? `${id}-original` : `${id}-${size}`;

    let filePath: string | null = null;
    let foundExt: string | null = null;

    for (const ext of this.allowedExtensions) {
      const tryPath = resolve(basePath, folder, `${fileBaseName}.${ext}`);
      if (isPathInside(basePath, tryPath) && existsSync(tryPath)) {
        filePath = tryPath;
        foundExt = ext;
        break;
      }
    }

    if (!filePath || !foundExt) {
      throw new NotFoundException('errors.image.notFound');
    }

    const mimeType = lookup(foundExt) || 'application/octet-stream';
    const fileStream = createReadStream(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileBaseName}.${foundExt}"`,
    });

    return new StreamableFile(fileStream);
  }

  @Post('upload/:folder')
  @UseGuards(RolesGuard)
  // Alumnos: solo su propia foto (carpeta user); la regla fina está en la política.
  @Roles('admin', 'moderator', 'user')
  // BE-08: límite de tamaño; multer ya no carga archivos gigantes en memoria.
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @DocUploadPicture()
  async uploadPicture(
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<string[]> {
    if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
      throw new BadRequestException(
        withI18nParams('errors.image.invalidFolderAllowed', {
          folders: [...ALLOWED_UPLOAD_FOLDERS].join(', '),
        }),
      );
    }
    const actor = { id: req.user.sub, role: req.user.role };
    let imageId: string;
    let subjectId: string;

    if (SERVER_ID_FOLDERS.has(folder)) {
      // BE-08: el cliente no elige el id, así que no puede sobrescribir imágenes ajenas.
      if (body.id) {
        throw new BadRequestException('errors.image.languageRequired');
      }
      subjectId = await this.resolveImageLanguage(body);
      imageId = randomUUID();
    } else {
      if (!body.id) {
        throw new BadRequestException('errors.image.idRequired');
      }
      subjectId = body.id;
      imageId = body.id;
    }

    await assertImageUploadAllowed(actor, folder, subjectId, {
      // Cubre permisos por idioma y por región (checkUserPermissionForLanguage).
      hasLanguagePermission: (userId, languageId) =>
        this.moderatorPermissionRepository.checkUserPermissionForLanguage(
          userId,
          languageId,
        ),
    });
    return await this.uploadPictureUseCase.execute(imageId, folder, file);
  }

  /** Idioma de una imagen de lección o quiz, a partir de `languageId` y/o `lessonId`. */
  private async resolveImageLanguage(body: UploadImageDto): Promise<string> {
    if (!body.lessonId) {
      if (!body.languageId) {
        throw new BadRequestException('errors.image.languageRequired');
      }
      return body.languageId;
    }
    const lessonLanguageId = await this.resourceIdResolver.resolveFromRelation(
      'lesson.languageId',
      body.lessonId,
    );
    if (!lessonLanguageId) {
      throw new NotFoundException('errors.lesson.notFound');
    }
    if (body.languageId && body.languageId !== lessonLanguageId) {
      throw new BadRequestException('errors.image.lessonLanguageMismatch');
    }
    return lessonLanguageId;
  }
}
