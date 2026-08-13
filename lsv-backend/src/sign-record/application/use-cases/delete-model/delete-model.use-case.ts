import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';

@Injectable()
export class DeleteModelUseCase {
  private readonly logger = new Logger(DeleteModelUseCase.name);

  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(id: string) {
    const model = await this.lessonModelRepository.findById(id);
    if (!model) throw new NotFoundException('Modelo no encontrado');

    await this.removeArtifacts(id);
    await this.lessonModelRepository.remove(model);
    return { success: true };
  }

  private async removeArtifacts(modelId: string) {
    const candidates: { path: string; kind: 'file' | 'dir' }[] = [
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

    for (const target of candidates) {
      try {
        if (target.kind === 'file') {
          await this.fileStoragePort.deleteFile(target.path);
        } else {
          await this.fileStoragePort.deleteDirectory(target.path);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Could not delete artifact ${target.path}: ${message}`,
        );
      }
    }
  }
}
