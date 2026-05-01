export interface FileStoragePort {
  saveJson(filePath: string, data: any): Promise<void>;
  makeDirectory(dirPath: string): Promise<void>;
  getSharedDir(): string;
}
