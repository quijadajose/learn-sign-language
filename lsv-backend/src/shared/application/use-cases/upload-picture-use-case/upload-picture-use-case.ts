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

    // Validar y sanitizar `file.path` antes de procesar
    const safeBaseDir = path.resolve('./uploads/tmp');
    const resolvedFilePath = path.resolve(file.path);
    if (
      !resolvedFilePath.startsWith(safeBaseDir) ||
      !fs.existsSync(resolvedFilePath)
    ) {
      throw new BadRequestException(
        'Uploaded file does not exist or invalid path',
      );
    }

    const sizes = { sm: 64, md: 128, lg: 256 };

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

    const imageUrls: Record<string, string> = {};

    try {
      const originalFileName = `${id}-original.${format}`;
      const originalPath = path.join(uploadsDir, originalFileName);

      // Mover el archivo en lugar de copiar y luego eliminar
      await fs.promises.rename(file.path, originalPath);
      imageUrls['original'] = `/uploads/${folder}/${originalFileName}`;

      for (const [key, size] of Object.entries(sizes)) {
        const resizedFileName = `${id}-${key}.${format}`;
        const filePath = path.join(uploadsDir, resizedFileName);

        await sharp(originalPath)
          .resize(size, size)
          .toFormat(format)
          .toFile(filePath);

        imageUrls[key] = `/uploads/${folder}/${resizedFileName}`;
      }

      return { imageUrls };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new BadRequestException('Error processing image');
    }
  }
}
