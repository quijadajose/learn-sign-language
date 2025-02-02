import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

export class UploadPictureUseCase {
    async execute(
        id: string,
        folder: string,
        format: 'png' | 'jpeg' | 'webp',
        file: Express.Multer.File
    ): Promise<{ imageUrls: Record<string, string> }> {
        if (!file) {
            throw new BadRequestException('No se recibió ninguna imagen');
        }
        
        const sizes = {
            sm: 64,
            md: 128,
            lg: 256
        };
    
        const uploadsDir = `./uploads/${folder}`;
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
    
        const imageUrls: Record<string, string> = {};
    
        try {
            // Guardar imagen original
            const originalPath = path.join(uploadsDir, `${id}-original.${format}`);
            await fs.promises.copyFile(file.path, originalPath);
            imageUrls['original'] = `/uploads/${folder}/${id}-original.${format}`;
    
            // Crear versiones redimensionadas
            for (const [key, size] of Object.entries(sizes)) {
                const filePath = path.join(uploadsDir, `${id}-${key}.${format}`);
                await sharp(file.path)
                    .resize(size, size)
                    .toFormat(format)
                    .toFile(filePath);
    
                imageUrls[key] = `/uploads/${folder}/${id}-${key}.${format}`;
            }
    
            // Eliminar archivo temporal
            fs.unlinkSync(file.path);
    
            return { imageUrls };
        } catch (error) {
            throw new BadRequestException('Error al procesar la imagen');
        }
    }  
}
