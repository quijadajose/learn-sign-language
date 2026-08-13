import { Inject, Injectable, Logger } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';
import { TrainingQueuePort } from 'src/sign-record/domain/ports/training-queue.port';

/** Solo se consideran stale jobs más viejos que este umbral. */
const STALE_MS = 2 * 60 * 60 * 1000; // 2h

@Injectable()
export class CleanupModelsUseCase {
  private readonly logger = new Logger(CleanupModelsUseCase.name);

  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
    @Inject('TrainingQueuePort')
    private readonly trainingQueue: TrainingQueuePort,
  ) {}

  async execute() {
    this.logger.log('Checking for stale model training states on startup...');

    const modelsToClean =
      await this.lessonModelRepository.findPendingOrTraining();
    const now = Date.now();
    let cleaned = 0;

    for (const model of modelsToClean) {
      const age = now - new Date(model.updatedAt ?? model.createdAt).getTime();
      if (age < STALE_MS) {
        continue;
      }

      try {
        const state = await this.trainingQueue.getJobState(model.id);
        if (state === 'active') {
          this.logger.log(
            `Skipping active job for model ${model.id} (age ${Math.round(age / 60000)}m)`,
          );
          continue;
        }
        if (state) {
          await this.trainingQueue.removeJob(model.id);
          this.logger.log(`Removed stale BullMQ job for model ${model.id}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Could not remove job ${model.id}: ${message}`);
      }

      model.status = 'FAILED';
      await this.lessonModelRepository.save(model);
      await this.deleteArtifacts(model.id);
      cleaned += 1;
    }

    if (cleaned > 0) {
      this.logger.warn(
        `Cleaned up ${cleaned} stale models (older than ${STALE_MS / 3600000}h).`,
      );
    }

    await this.sweepOrphanTrainingFiles(now);
  }

  private async deleteArtifacts(modelId: string) {
    const targets: { path: string; kind: 'file' | 'dir' }[] = [
      {
        path: this.fileStoragePort.sharedPath(
          'training_data',
          `${modelId}.json`,
        ),
        kind: 'file',
      },
      {
        path: this.fileStoragePort.sharedPath(
          'training_data',
          `train_${modelId}.json`,
        ),
        kind: 'file',
      },
      {
        path: this.fileStoragePort.sharedPath('models', `model_${modelId}`),
        kind: 'dir',
      },
    ];

    for (const target of targets) {
      try {
        if (target.kind === 'file') {
          await this.fileStoragePort.deleteFile(target.path);
        } else {
          await this.fileStoragePort.deleteDirectory(target.path);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Could not delete artifact ${target.path}: ${message}`,
        );
      }
    }
  }

  /**
   * Deletes training JSON files older than STALE_MS when the matching model
   * is missing or already terminal (FAILED / READY leftovers after rollback).
   */
  private async sweepOrphanTrainingFiles(now: number) {
    const trainingDir = this.fileStoragePort.sharedPath('training_data');
    const entries = await this.fileStoragePort.listFileEntries(trainingDir);
    let removed = 0;

    for (const entry of entries) {
      if (!entry.name.endsWith('.json')) continue;
      if (now - entry.mtimeMs < STALE_MS) continue;

      const base = entry.name.replace(/\.json$/, '');
      const modelId = base.startsWith('train_')
        ? base.slice('train_'.length)
        : base;
      if (!modelId) continue;

      try {
        const model = await this.lessonModelRepository.findById(modelId);
        // Keep files for in-flight jobs.
        if (
          model &&
          (model.status === 'PENDING' || model.status === 'TRAINING')
        ) {
          continue;
        }

        await this.fileStoragePort.deleteFile(entry.path);
        // READY models keep their exported model dir; drop FAILED/missing only.
        if (!model || model.status === 'FAILED') {
          await this.fileStoragePort.deleteDirectory(
            this.fileStoragePort.sharedPath('models', `model_${modelId}`),
          );
        }
        removed += 1;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Orphan sweep failed for ${entry.name}: ${message}`);
      }
    }

    if (removed > 0) {
      this.logger.warn(`Removed ${removed} orphan training_data artifacts.`);
    }
  }
}
