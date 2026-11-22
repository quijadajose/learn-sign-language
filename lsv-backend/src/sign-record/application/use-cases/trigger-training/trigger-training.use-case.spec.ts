import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';
import { TrainingDatasetSource } from '../../../domain/ports/file-storage.port.js';
import { TriggerTrainingUseCase } from './trigger-training.use-case.js';

type FakeRecording = {
  id: string;
  landmarks: unknown[];
  sign: {
    id: string;
    name: string;
    detectionType: 'static' | 'dynamic';
    isGlobal: boolean;
  };
};

type CapturedDataset = {
  path: string;
  modelType: string;
  samples: { signName: string }[];
  noise: { signName: string }[] | undefined;
};

function rec(
  id: string,
  opts: {
    dynamic?: boolean;
    global?: boolean;
    frames?: number;
    signId?: string;
  } = {},
): FakeRecording {
  return {
    id,
    landmarks: Array.from({ length: opts.frames ?? 2 }, () => [0]),
    sign: {
      id: opts.signId ?? `s-${id}`,
      name: `sign-${id}`,
      detectionType: opts.dynamic ? 'dynamic' : 'static',
      isGlobal: Boolean(opts.global),
    },
  };
}

/** Repositorio fake con paginación keyset; no expone ningún "traer todo". */
function pagedRepository(all: FakeRecording[]) {
  return {
    findValidatedLessonTrainingPage: jest.fn(
      async (
        _lessonId: string,
        _regionId: string | undefined,
        afterId: string | undefined,
        limit: number,
      ) => {
        const start = afterId ? all.findIndex((r) => r.id === afterId) + 1 : 0;
        return all.slice(start, start + limit) as unknown as SignRecording[];
      },
    ),
  };
}

async function drain<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iterable) out.push(item);
  return out;
}

describe('TriggerTrainingUseCase (BE-11 streaming)', () => {
  const lessonVariant = {
    id: 'variant-1',
    baseLesson: { id: 'lesson-1', name: 'Saludos' },
    region: { id: 'region-1' },
  };
  let captured: CapturedDataset[];
  let signs: unknown[];
  let fileStorage: {
    sharedPath: jest.Mock;
    workerPath: jest.Mock;
    makeDirectory: jest.Mock;
    saveJson: jest.Mock;
    saveTrainingDataset: jest.Mock;
    deleteFile: jest.Mock;
    deleteDirectory: jest.Mock;
  };
  let lessonModels: {
    create: jest.Mock;
    save: jest.Mock;
    findById: jest.Mock;
    remove: jest.Mock;
  };
  let queue: { enqueueTrainLessonModel: jest.Mock; removeJob: jest.Mock };

  function build(all: FakeRecording[]) {
    const repo = pagedRepository(all);
    const lessonVariants = {
      findByIdWithBaseAndRegion: jest.fn(async () => lessonVariant),
    };
    const signRepo = { findForTraining: jest.fn(async () => signs) };
    const useCase = new TriggerTrainingUseCase(
      lessonVariants as never,
      lessonModels as never,
      signRepo as never,
      repo as never,
      fileStorage as never,
      queue as never,
    );
    return { repo, useCase };
  }

  beforeEach(() => {
    captured = [];
    signs = [];
    fileStorage = {
      sharedPath: jest.fn((...s: string[]) => ['/shared', ...s].join('/')),
      workerPath: jest.fn((...s: string[]) => ['/worker', ...s].join('/')),
      makeDirectory: jest.fn(async () => undefined),
      saveJson: jest.fn(async () => undefined),
      // Simula el escritor real: consume ambos generadores.
      saveTrainingDataset: jest.fn(
        async (path: string, dataset: TrainingDatasetSource) => {
          const samples = await drain(dataset.samples);
          const noise = dataset.globalStaticNoise
            ? await drain(dataset.globalStaticNoise)
            : undefined;
          captured.push({ path, modelType: dataset.modelType, samples, noise });
        },
      ),
      deleteFile: jest.fn(async () => undefined),
      deleteDirectory: jest.fn(async () => undefined),
    };
    lessonModels = {
      create: jest.fn((data: object) => data),
      save: jest.fn(async (model: object) => model),
      findById: jest.fn(async () => null),
      remove: jest.fn(async (model: object) => model),
    };
    queue = {
      enqueueTrainLessonModel: jest.fn(async () => undefined),
      removeJob: jest.fn(async () => undefined),
    };
  });

  it('reads recordings in keyset pages and streams the dataset (never saveJson)', async () => {
    const all = Array.from({ length: 201 }, (_, i) =>
      rec(`r${String(i).padStart(3, '0')}`),
    );
    const { repo, useCase } = build(all);

    await useCase.execute('variant-1');

    const calls = repo.findValidatedLessonTrainingPage.mock.calls;
    expect(calls[0]).toEqual(['lesson-1', 'region-1', undefined, 200]);
    expect(calls[1][2]).toBe('r199');
    // Ninguna página supera el tamaño fijado.
    for (const call of calls) expect(call[3]).toBe(200);
    // 2 páginas en la pasada de resumen + 2 al escribir el dataset estático.
    expect(calls).toHaveLength(4);
    expect(fileStorage.saveJson).not.toHaveBeenCalled();
    expect(captured).toHaveLength(1);
    expect(captured[0].samples).toHaveLength(201);
    expect(captured[0].path).toMatch(/\/shared\/training_data\/.+\.json$/);
  });

  it('splits dynamic recordings into their own job and feeds global static noise to it', async () => {
    const { useCase } = build([
      rec('a'),
      rec('b', { global: true }),
      rec('c', { dynamic: true }),
    ]);

    const result = await useCase.execute('variant-1');

    expect(result.jobs.map((j) => j.modelType)).toEqual(['static', 'dynamic']);
    const staticJob = captured.find((c) => c.modelType === 'static')!;
    const dynamicJob = captured.find((c) => c.modelType === 'dynamic')!;
    expect(staticJob.samples.map((s) => s.signName)).toEqual([
      'sign-a',
      'sign-b',
    ]);
    expect(dynamicJob.samples.map((s) => s.signName)).toEqual(['sign-c']);
    expect(dynamicJob.noise?.map((s) => s.signName)).toEqual(['sign-b']);
  });

  it('appends legacy landmarks only for signs without validated recordings', async () => {
    signs = [
      { id: 's-a', name: 'covered', landmarks: [[9]] },
      {
        id: 's-legacy',
        name: 'legacy',
        detectionType: 'static',
        isGlobal: false,
        landmarks: [[1]],
        variants: [{ region: { id: 'region-1' }, landmarks: [[2]] }],
      },
      { id: 's-empty', name: 'empty', landmarks: [] },
    ];
    const { useCase } = build([rec('a')]);

    await useCase.execute('variant-1');

    expect(captured[0].samples).toEqual([
      expect.objectContaining({ signName: 'sign-a' }),
      expect.objectContaining({ signName: 'legacy', landmarks: [[2]] }),
    ]);
  });

  it('throws noValidatedRecordings when there is nothing to train', async () => {
    const { useCase } = build([]);
    await expect(useCase.execute('variant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fileStorage.saveTrainingDataset).not.toHaveBeenCalled();
  });

  it('rejects an oversized recording before writing or enqueueing anything', async () => {
    const { useCase } = build([rec('ok'), rec('huge', { frames: 601 })]);
    await expect(useCase.execute('variant-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fileStorage.saveTrainingDataset).not.toHaveBeenCalled();
    expect(queue.enqueueTrainLessonModel).not.toHaveBeenCalled();
  });

  it('rejects too many samples before writing or enqueueing anything', async () => {
    const all = Array.from({ length: 2001 }, (_, i) =>
      rec(`r${String(i).padStart(4, '0')}`),
    );
    const { useCase } = build(all);
    await expect(useCase.execute('variant-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fileStorage.saveTrainingDataset).not.toHaveBeenCalled();
    expect(queue.enqueueTrainLessonModel).not.toHaveBeenCalled();
  });

  it('rolls back the job when enqueueing fails', async () => {
    queue.enqueueTrainLessonModel.mockRejectedValueOnce(
      new Error('redis down'),
    );
    const { useCase } = build([rec('a')]);

    await expect(useCase.execute('variant-1')).rejects.toThrow('redis down');
    expect(queue.removeJob).toHaveBeenCalled();
    expect(fileStorage.deleteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\/shared\/training_data\/.+\.json$/),
    );
  });
});
