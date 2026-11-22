import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { LocalFileStorageAdapter } from './local-file-storage.adapter.js';

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

  describe('saveTrainingDataset (BE-11)', () => {
    async function* gen<T>(items: T[]): AsyncGenerator<T> {
      for (const item of items) yield item;
    }

    it('writes the same JSON as a materialized dataset, without leaving tmp files', async () => {
      const samples = [
        {
          signName: 'hola',
          detectionType: 'static' as const,
          isGlobal: false,
          landmarks: [[1, 2]],
        },
        {
          signName: 'adios',
          detectionType: 'static' as const,
          isGlobal: true,
          landmarks: [[3]],
        },
      ];
      const noise = [
        {
          signName: 'ruido',
          detectionType: 'static' as const,
          isGlobal: true,
          landmarks: [[0.5]],
        },
      ];
      const target = path.join(tmpDir, 'train_x.json');

      await adapter.saveTrainingDataset(target, {
        modelType: 'dynamic',
        samples: gen(samples),
        globalStaticNoise: gen(noise),
      });

      const written = JSON.parse(await fs.readFile(target, 'utf8'));
      expect(written).toEqual({
        modelType: 'dynamic',
        samples,
        globalStaticNoise: noise,
      });
      await expect(fs.access(`${target}.tmp`)).rejects.toThrow();
    });

    it('writes empty arrays when there are no samples or noise', async () => {
      const target = path.join(tmpDir, 'train_empty.json');
      await adapter.saveTrainingDataset(target, {
        modelType: 'static',
        samples: gen([]),
      });
      expect(JSON.parse(await fs.readFile(target, 'utf8'))).toEqual({
        modelType: 'static',
        samples: [],
        globalStaticNoise: [],
      });
    });

    it('removes the tmp file and does not create the target when the source fails', async () => {
      const target = path.join(tmpDir, 'train_fail.json');
      async function* failing() {
        yield {
          signName: 'ok',
          detectionType: 'static' as const,
          isGlobal: false,
          landmarks: [],
        };
        throw new Error('db down');
      }
      await expect(
        adapter.saveTrainingDataset(target, {
          modelType: 'static',
          samples: failing(),
        }),
      ).rejects.toThrow('db down');
      await expect(fs.access(target)).rejects.toThrow();
      await expect(fs.access(`${target}.tmp`)).rejects.toThrow();
    });
  });
});
