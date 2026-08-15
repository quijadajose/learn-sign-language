import {
  BadRequestException,
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { lookup } from 'mime-types';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { DocGetImage, DocImages, DocUploadPicture } from './docs/images.docs';
import { withI18nParams } from 'src/i18n';

export class UploadImageDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  id: string;
}

const ALLOWED_UPLOAD_FOLDERS = new Set(['user', 'quiz', 'languages', 'lesson']);

@DocImages()
@Controller('images')
export class ImagesController {
  constructor(private readonly uploadPictureUseCase: UploadPictureUseCase) {}
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
    if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
      throw new NotFoundException('Image not found');
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

  @Post('upload/:folder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'moderator')
  @UseInterceptors(FileInterceptor('file'))
  @DocUploadPicture()
  async uploadPicture(
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ): Promise<string[]> {
    if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
      throw new BadRequestException(
        withI18nParams('errors.image.invalidFolderAllowed', {
          folders: [...ALLOWED_UPLOAD_FOLDERS].join(', '),
        }),
      );
    }
    const { id } = body;
    return await this.uploadPictureUseCase.execute(id, folder, file);
  }
}
