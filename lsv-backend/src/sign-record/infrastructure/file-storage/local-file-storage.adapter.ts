import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStoragePort } from '../../domain/ports/file-storage.port';

@Injectable()
export class LocalFileStorageAdapter implements FileStoragePort {
  private readonly logger = new Logger(LocalFileStorageAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async saveJson(filePath: string, data: unknown): Promise<void> {
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

  sharedPath(...segments: string[]): string {
    return path.join(this.getSharedDir(), ...segments);
  }

  workerPath(...segments: string[]): string {
    const workerRoot =
      this.configService.get<string>('WORKER_SHARED_DATA_DIR') || '/shared';
    return path.posix.join(workerRoot, ...segments);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: string }).code
          : undefined;
      if (code !== 'ENOENT') throw err;
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const entries = await this.listFileEntries(dirPath);
    return entries.map((e) => e.path);
  }

  async listFileEntries(
    dirPath: string,
  ): Promise<{ path: string; name: string; mtimeMs: number }[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: { path: string; name: string; mtimeMs: number }[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fullPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(fullPath);
        files.push({
          path: fullPath,
          name: entry.name,
          mtimeMs: stat.mtimeMs,
        });
      }
      return files;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: string }).code
          : undefined;
      if (code === 'ENOENT') return [];
      throw err;
    }
  }

  async ensureSharedDirWritable(): Promise<boolean> {
    const shared = this.getSharedDir();
    try {
      await fs.mkdir(shared, { recursive: true });
      const probe = path.join(shared, '.write-probe');
      await fs.writeFile(probe, 'ok');
      await fs.unlink(probe);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Shared data dir is not writable (${shared}): ${message}. ` +
          'Set SHARED_DATA_DIR to the API volume mount (e.g. /src/app/shared).',
      );
      return false;
    }
  }

  async sha256File(filePath: string): Promise<string | null> {
    try {
      const buf = await fs.readFile(filePath);
      return createHash('sha256').update(buf).digest('hex');
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: string }).code
          : undefined;
      if (code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }
}
