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
    // Sanitize id and folder to avoid path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || !/^[a-zA-Z0-9_-]+$/.test(folder)) {
      throw new BadRequestException('Invalid folder or id format');
    }

    const sizes = { sm: 64, md: 128, lg: 256 };

    // Ensure `uploads` is the secure root directory
    const baseUploadDir = path.resolve('./uploads');
    const uploadsDir = path.join(baseUploadDir, folder);

    // Prevent path traversal by validating that `uploadsDir` is still under `baseUploadDir`
    if (!uploadsDir.startsWith(baseUploadDir)) {
      throw new BadRequestException('Invalid upload directory');
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageUrls: Record<string, string> = {};

    try {
      const originalFileName = `${id}-original.${format}`;
      const originalPath = path.join(uploadsDir, originalFileName);

      await fs.promises.copyFile(file.path, originalPath);
      imageUrls['original'] = `/uploads/${folder}/${originalFileName}`;

      for (const [key, size] of Object.entries(sizes)) {
        const resizedFileName = `${id}-${key}.${format}`;
        const filePath = path.join(uploadsDir, resizedFileName);

        await sharp(file.path)
          .resize(size, size)
          .toFormat(format)
          .toFile(filePath);

        imageUrls[key] = `/uploads/${folder}/${resizedFileName}`;
      }

      fs.unlinkSync(file.path);

      return { imageUrls };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error processing image');
    }
  }
}
