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
import { join, resolve } from 'path';
import { Public } from '../../../../auth/infrastructure/decorators/public.decorator.js';
import { lookup } from 'mime-types';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureUseCase } from '../../../application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import { assertImageUploadAllowed } from '../../../application/image-upload-policy.js';
import { ResourceIdResolver } from '../../../../permissions/infrastructure/guards/resource-access/resource-id-resolver.js';
import { IsUUID, isUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import {
  DocGetImage,
  DocImages,
  DocUploadPicture,
} from './docs/images.docs.js';
import { withI18nParams } from '../../../../i18n/index.js';

export class UploadImageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;
}

const ALLOWED_UPLOAD_FOLDERS = new Set(['user', 'quiz', 'languages', 'lesson']);

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
      if (tryPath.startsWith(basePath) && existsSync(tryPath)) {
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
    const { id } = body;
    await assertImageUploadAllowed(
      { id: req.user.sub, role: req.user.role },
      folder,
      id,
      {
        // Cubre permisos por idioma y por región (checkUserPermissionForLanguage).
        hasLanguagePermission: (userId, languageId) =>
          this.moderatorPermissionRepository.checkUserPermissionForLanguage(
            userId,
            languageId,
          ),
        resolveLanguageIdForLesson: (lessonId) =>
          this.resourceIdResolver.resolveFromRelation(
            'lesson.languageId',
            lessonId,
          ),
        resolveLanguageIdForQuiz: (quizId) =>
          this.resourceIdResolver.resolveFromRelation(
            'quiz.languageId',
            quizId,
          ),
      },
    );
    return await this.uploadPictureUseCase.execute(id, folder, file);
  }
}
