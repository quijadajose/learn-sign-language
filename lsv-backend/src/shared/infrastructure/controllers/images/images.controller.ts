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
import { createReadStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { lookup } from 'mime-types';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';

@Controller('images')
export class ImagesController {
  constructor(private readonly uploadPictureUseCase: UploadPictureUseCase) {}
  private readonly allowedExtensions = ['png', 'jpeg', 'jpg', 'webp'];

  @Public()
  @Get(':folder/:filename')
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
  async uploadPicture(
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { id: string; format: 'png' | 'jpeg' | 'webp' },
  ): Promise<{ imageUrls: Record<string, string> }> {
    const { id, format } = body;
    return await this.uploadPictureUseCase.execute(id, folder, format, file);
  }
}
