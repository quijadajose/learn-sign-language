import { BadRequestException } from '@nestjs/common';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';
import { TriggerCustomTrainingDto } from '../../../domain/dto/sign-record.dto.js';
import { TrainingDatasetSource } from '../../../domain/ports/file-storage.port.js';
import { TriggerCustomTrainingUseCase } from './trigger-custom-training.use-case.js';

type FakeRecording = {
  id: string;
  landmarks: unknown[];
  sign: {
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
  opts: { dynamic?: boolean; global?: boolean; frames?: number } = {},
): FakeRecording {
  return {
    id,
    landmarks: Array.from({ length: opts.frames ?? 2 }, () => [0]),
    sign: {
      name: `sign-${id}`,
      detectionType: opts.dynamic ? 'dynamic' : 'static',
      isGlobal: Boolean(opts.global),
    },
  };
}

/** Repositorio fake con paginación keyset sobre una lista en memoria. */
function pagedRepository(all: FakeRecording[]) {
  return {
    findTrainingPage: jest.fn(
      async (_filters: unknown, afterId: string | undefined, limit: number) => {
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

describe('TriggerCustomTrainingUseCase (BE-11 streaming)', () => {
  const filters = {
    languageId: 'lang-1',
  } as unknown as TriggerCustomTrainingDto;
  let captured: CapturedDataset[];
  let fileStorage: {
    sharedPath: jest.Mock;
    workerPath: jest.Mock;
    makeDirectory: jest.Mock;
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
  let queue: { enqueueTrainCustomModel: jest.Mock; removeJob: jest.Mock };

  function build(all: FakeRecording[]) {
    const repo = pagedRepository(all);
    const useCase = new TriggerCustomTrainingUseCase(
      repo as never,
      lessonModels as never,
      fileStorage as never,
      queue as never,
    );
    return { repo, useCase };
  }

  beforeEach(() => {
    captured = [];
    fileStorage = {
      sharedPath: jest.fn((...s: string[]) => ['/shared', ...s].join('/')),
      workerPath: jest.fn((...s: string[]) => ['/worker', ...s].join('/')),
      makeDirectory: jest.fn(async () => undefined),
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
      enqueueTrainCustomModel: jest.fn(async () => undefined),
      removeJob: jest.fn(async () => undefined),
    };
  });

  it('throws insufficientTrainingData when there are no recordings', async () => {
    const { useCase } = build([]);
    await expect(useCase.execute(filters)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fileStorage.saveTrainingDataset).not.toHaveBeenCalled();
  });

  it('creates only a static job for static-only recordings', async () => {
    const { useCase } = build([rec('a'), rec('b')]);
    const result = await useCase.execute(filters);

    expect(result.jobs.map((j) => j.modelType)).toEqual(['static']);
    expect(captured).toHaveLength(1);
    expect(captured[0].samples.map((s) => s.signName)).toEqual([
      'sign-a',
      'sign-b',
    ]);
    expect(captured[0].noise).toBeUndefined();
  });

  it('stores the authorized language on the model (BE-10)', async () => {
    const { useCase } = build([rec('a')]);
    await useCase.execute(filters);

    expect(lessonModels.create).toHaveBeenCalledWith(
      expect.objectContaining({ language: { id: 'lang-1' } }),
    );
  });

  it('leaves the language empty when the filters have none (admin only)', async () => {
    const { useCase } = build([rec('a')]);
    await useCase.execute({} as TriggerCustomTrainingDto);

    expect(lessonModels.create.mock.calls[0][0]).not.toHaveProperty('language');
  });

  it('splits dynamic recordings into their own job and feeds global static noise to it', async () => {
    const all = [
      rec('a'),
      rec('b', { global: true }),
      rec('c', { dynamic: true }),
    ];
    const { useCase } = build(all);
    const result = await useCase.execute(filters);

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

  it('reads recordings in pages, passing the last id as the keyset cursor', async () => {
    const all = Array.from({ length: 201 }, (_, i) =>
      rec(`r${String(i).padStart(3, '0')}`),
    );
    const { repo, useCase } = build(all);

    await useCase.execute(filters);

    const cursors = repo.findTrainingPage.mock.calls.map((call) => call[1]);
    expect(cursors[0]).toBeUndefined();
    expect(cursors[1]).toBe('r199');
    // 2 páginas en la pasada de resumen + 2 al escribir el dataset estático.
    expect(repo.findTrainingPage).toHaveBeenCalledTimes(4);
    expect(captured[0].samples).toHaveLength(201);
  });

  it('rejects a recording whose frame count exceeds the trainer limit', async () => {
    const { useCase } = build([rec('huge', { frames: 601 })]);
    await expect(useCase.execute(filters)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fileStorage.saveTrainingDataset).not.toHaveBeenCalled();
  });

  it('rolls back the job when enqueueing fails', async () => {
    queue.enqueueTrainCustomModel.mockRejectedValueOnce(
      new Error('redis down'),
    );
    const { useCase } = build([rec('a')]);

    await expect(useCase.execute(filters)).rejects.toThrow('redis down');
    expect(queue.removeJob).toHaveBeenCalled();
    expect(fileStorage.deleteFile).toHaveBeenCalledWith(
      expect.stringMatching(/\/shared\/training_data\/train_.+\.json$/),
    );
  });
});
