import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export class UploadPictureUseCase {
  async execute(
    id: string,
    folder: string,
    file: Express.Multer.File,
  ): Promise<string[]> {
    // BE-08: el id va al nombre de archivo; solo se acepta un UUID.
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid image id');
    }

    if (!file) {
      throw new BadRequestException('errors.image.noImageReceived');
    }

    if (!file.buffer) {
      throw new BadRequestException('errors.image.noImageBuffer');
    }

    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(file.buffer);
    if (
      !type ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(type.mime)
    ) {
      throw new BadRequestException(
        'Formato de imagen no soportado. Use PNG, JPEG o WebP',
      );
    }

    const format = this.mapMimeToFormat(type.mime);

    const sizes = { original: null, sm: 64, md: 128, lg: 256 };

    if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
      throw new BadRequestException('errors.image.invalidFolder');
    }

    const baseUploadDir = path.resolve('./uploads');
    const uploadsDir = path.join(baseUploadDir, folder);

    if (!uploadsDir.startsWith(baseUploadDir + path.sep)) {
      throw new BadRequestException('errors.image.invalidDirectory');
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls: string[] = [];

    try {
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.format) {
        throw new BadRequestException(
          'No se pudo procesar la imagen con Sharp',
        );
      }

      for (const [key, size] of Object.entries(sizes)) {
        const fileName = `${id}-${key}.${format}`;
        const filePath = path.join(uploadsDir, fileName);

        // Al reemplazar, borrar variantes con otra extensión (BE-08).
        for (const other of ['png', 'jpeg', 'webp']) {
          if (other !== format) {
            await fs.promises
              .rm(path.join(uploadsDir, `${id}-${key}.${other}`), {
                force: true,
              })
              .catch(() => undefined);
          }
        }

        if (key === 'original') {
          // BE-08: el original también se re-codifica: sin EXIF/GPS y con la orientación aplicada.
          await sharp(file.buffer).rotate().toFormat(format).toFile(filePath);
        } else {
          await sharp(file.buffer)
            .resize(size, size)
            .toFormat(format)
            .toFile(filePath);
        }
        imageUrls.push(`/images/${folder}/${id}?size=${key}`);
      }
      return imageUrls;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Error procesando la imagen. Verifique que sea un archivo de imagen válido',
      );
    }
  }

  private mapMimeToFormat(mime: string): 'png' | 'jpeg' | 'webp' {
    const mimeToFormat: Record<string, 'png' | 'jpeg' | 'webp'> = {
      'image/png': 'png',
      'image/jpeg': 'jpeg',
      'image/webp': 'webp',
    };

    return mimeToFormat[mime] || 'png';
  }
}
