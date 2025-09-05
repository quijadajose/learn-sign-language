import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

export class UploadPictureUseCase {
  async execute(
    id: string,
    folder: string,
    format: 'png' | 'jpeg' | 'webp',
    file: Express.Multer.File,
  ): Promise<string[]> {
    if (!file) {
      throw new BadRequestException('No image received');
    }

    // En este caso, validamos que el buffer exista.
    if (!file.buffer) {
      throw new BadRequestException('No image buffer available');
    }

    const sizes = { original: null, sm: 64, md: 128, lg: 256 };

    // Asegurar que `uploads` es el directorio base seguro
    const baseUploadDir = path.resolve('./uploads');
    const uploadsDir = path.join(baseUploadDir, folder);

    // Evitar path traversal validando que `uploadsDir` sigue bajo `baseUploadDir`
    if (!uploadsDir.startsWith(baseUploadDir)) {
      throw new BadRequestException('Invalid upload directory');
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls: string[] = [];

    try {
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
      throw new BadRequestException('Error processing image');
    }
  }
}
