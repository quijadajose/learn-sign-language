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
  ): Promise<{ imageUrls: Record<string, string> }> {
    if (!file) {
      throw new BadRequestException('No image received');
    }

    const sizes = {
      sm: 64,
      md: 128,
      lg: 256,
    };

    const uploadsDir = `./uploads/${folder}`;
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls: Record<string, string> = {};

    try {
      const originalPath = path.join(uploadsDir, `${id}-original.${format}`);
      await fs.promises.copyFile(file.path, originalPath);
      imageUrls['original'] = `/uploads/${folder}/${id}-original.${format}`;

      for (const [key, size] of Object.entries(sizes)) {
        const filePath = path.join(uploadsDir, `${id}-${key}.${format}`);
        await sharp(file.path)
          .resize(size, size)
          .toFormat(format)
          .toFile(filePath);

        imageUrls[key] = `/uploads/${folder}/${id}-${key}.${format}`;
      }

      fs.unlinkSync(file.path);

      return { imageUrls };
    } catch {
      throw new BadRequestException('Error processing image');
    }
  }
}
