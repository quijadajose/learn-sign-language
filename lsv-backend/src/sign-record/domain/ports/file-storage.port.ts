export interface FileStoragePort {
  saveJson(filePath: string, data: unknown): Promise<void>;
  makeDirectory(dirPath: string): Promise<void>;
  /** Absolute shared root as seen by the API process. */
  getSharedDir(): string;
  /** Absolute path under the API shared root. */
  sharedPath(...segments: string[]): string;
  /** Absolute path under the trainer worker shared root (BullMQ payload). */
  workerPath(...segments: string[]): string;
  deleteFile(filePath: string): Promise<void>;
  deleteDirectory(dirPath: string): Promise<void>;
  /** List absolute file paths in a directory (non-recursive). Missing dir → []. */
  listFiles(dirPath: string): Promise<string[]>;
  /** List files with mtime (non-recursive). Missing dir → []. */
  listFileEntries(
    dirPath: string,
  ): Promise<{ path: string; name: string; mtimeMs: number }[]>;
  /** Ensure shared root exists and is writable; returns false on failure. */
  ensureSharedDirWritable(): Promise<boolean>;
}
