import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStoragePort } from '../../domain/ports/file-storage.port';

@Injectable()
export class LocalFileStorageAdapter implements FileStoragePort {
  constructor(private readonly configService: ConfigService) {}

  async saveJson(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data));
  }

  async makeDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  getSharedDir(): string {
    return (
      this.configService.get<string>('SHARED_DATA_DIR') ||
      path.join(process.cwd(), 'shared')
    );
  }
}
