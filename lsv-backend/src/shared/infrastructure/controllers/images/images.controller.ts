import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { lookup } from 'mime-types';
import type { Response } from 'express';

@Controller('images')
export class ImagesController {
  @Public()
  @Get(':folder/:filename')
  getImage(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const basePath = join(process.cwd(), 'uploads');
    const filePath = resolve(basePath, folder, filename);

    if (!filePath.startsWith(basePath)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }

    const mimeType = lookup(filePath) || 'application/octet-stream'; // Detecta el tipo de contenido

    const fileStream = createReadStream(filePath);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(fileStream);
  }
}
