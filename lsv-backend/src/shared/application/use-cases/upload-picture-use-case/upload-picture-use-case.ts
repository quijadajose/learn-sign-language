import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

export class UploadPictureUseCase {
  async execute(
    id: string,
    folder: string,
    file: Express.Multer.File,
  ): Promise<string[]> {
    if (!file) {
      throw new BadRequestException('No image received');
    }

    if (!file.buffer) {
      throw new BadRequestException('No image buffer available');
    }

    const type = await fileTypeFromBuffer(file.buffer);
    if (!type || !['image/png', 'image/jpeg', 'image/webp'].includes(type.mime)) {
      throw new BadRequestException('Formato de imagen no soportado. Use PNG, JPEG o WebP');
    }

    const format = this.mapMimeToFormat(type.mime);

    const sizes = { original: null, sm: 64, md: 128, lg: 256 };

    const baseUploadDir = path.resolve('./uploads');
    const uploadsDir = path.join(baseUploadDir, folder);

    if (!uploadsDir.startsWith(baseUploadDir)) {
      throw new BadRequestException('Invalid upload directory');
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls: string[] = [];

    try {
      const metadata = await sharp(file.buffer).metadata();
      
      if (!metadata.format) {
        throw new BadRequestException('No se pudo procesar la imagen con Sharp');
      }

      for (const [key, size] of Object.entries(sizes)) {
        const fileName = `${id}-${key}.${format}`;
        const filePath = path.join(uploadsDir, fileName);
        
        if (key === 'original') {
          await fs.promises.writeFile(filePath, file.buffer);
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
      console.error('Error processing image:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error procesando la imagen. Verifique que sea un archivo de imagen válido');
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
