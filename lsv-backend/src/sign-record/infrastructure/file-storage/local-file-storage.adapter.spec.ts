import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { LocalFileStorageAdapter } from './local-file-storage.adapter';

describe('LocalFileStorageAdapter', () => {
  let tmpDir: string;
  let adapter: LocalFileStorageAdapter;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lsv-shared-'));
    const config = {
      get: (key: string) => {
        if (key === 'SHARED_DATA_DIR') return tmpDir;
        if (key === 'WORKER_SHARED_DATA_DIR') return '/shared';
        return undefined;
      },
    } as ConfigService;
    adapter = new LocalFileStorageAdapter(config);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('resolves sharedPath under SHARED_DATA_DIR', () => {
    expect(adapter.sharedPath('training_data', 'a.json')).toBe(
      path.join(tmpDir, 'training_data', 'a.json'),
    );
  });

  it('resolves workerPath with posix joins under WORKER_SHARED_DATA_DIR', () => {
    expect(adapter.workerPath('training_data', 'a.json')).toBe(
      '/shared/training_data/a.json',
    );
    expect(adapter.workerPath('models', 'model_x')).toBe(
      '/shared/models/model_x',
    );
  });

  it('lists files and reports writable shared dir', async () => {
    const dir = adapter.sharedPath('training_data');
    await adapter.makeDirectory(dir);
    await adapter.saveJson(adapter.sharedPath('training_data', 'a.json'), {
      ok: true,
    });
    const files = await adapter.listFiles(dir);
    expect(files).toEqual([path.join(dir, 'a.json')]);
    await expect(adapter.ensureSharedDirWritable()).resolves.toBe(true);
  });

  it('hashes a file with sha256File and returns null if missing', async () => {
    const filePath = adapter.sharedPath('models', 'm1', 'model.json');
    await adapter.makeDirectory(adapter.sharedPath('models', 'm1'));
    await adapter.saveJson(filePath, { ok: true });
    const digest = await adapter.sha256File(filePath);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    await expect(
      adapter.sha256File(adapter.sharedPath('missing.json')),
    ).resolves.toBeNull();
  });
});
