import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { SignRecording } from '../src/shared/domain/entities/signRecording.js';
import {
  cleanDatabase,
  createLanguageCurriculum,
  getAdminToken,
  validLandmarkFrames,
  type LanguageCurriculum,
} from './test-utils.js';

/**
 * BE-11: el entrenamiento por lección lee las grabaciones por páginas (keyset de 200)
 * y escribe el dataset en streaming. Con 201 grabaciones la consulta paginada tiene
 * que cruzar el límite de página contra Postgres sin perder ni repetir ninguna.
 */
describe('Per-lesson training dataset (BE-11, e2e)', () => {
  const RECORDINGS = 201;
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let curriculum: LanguageCurriculum;
  let sharedDir: string;
  const originalSharedDir = process.env.SHARED_DATA_DIR;

  beforeAll(async () => {
    // El dataset se escribe en un directorio temporal, no en ./shared del repo.
    sharedDir = mkdtempSync(join(tmpdir(), 'lsv-training-'));
    process.env.SHARED_DATA_DIR = sharedDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
    adminToken = await getAdminToken(app, dataSource);
    curriculum = await createLanguageCurriculum(app, adminToken, 'TRAIN');

    const sign = await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hola',
        languageId: curriculum.languageId,
        lessonId: curriculum.lessonId,
        detectionType: 'static',
      })
      .expect(201);

    // Inserción directa: 201 grabaciones por la API serían 201 requests lentas.
    const repo = dataSource.getRepository(SignRecording);
    await repo.save(
      Array.from({ length: RECORDINGS }, () =>
        repo.create({
          landmarks: validLandmarkFrames(2),
          dominantHand: 'right',
          isValidated: true,
          sign: { id: sign.body.id },
          region: { id: curriculum.regionId },
        }),
      ),
    );
  }, 60000);

  afterAll(async () => {
    if (originalSharedDir === undefined) {
      delete process.env.SHARED_DATA_DIR;
    } else {
      process.env.SHARED_DATA_DIR = originalSharedDir;
    }
    rmSync(sharedDir, { recursive: true, force: true });
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  it('writes every validated recording exactly once across keyset pages', async () => {
    const response = await request(app.getHttpServer())
      .post(`/sign-record/train/${curriculum.lessonVariantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(response.body.status).toBe('QUEUED');
    expect(response.body.jobs).toEqual([
      { modelId: expect.any(String), modelType: 'static' },
    ]);
    const modelId: string = response.body.jobs[0].modelId;

    const datasetDir = join(sharedDir, 'training_data');
    expect(readdirSync(datasetDir)).toContain(`${modelId}.json`);
    const dataset = JSON.parse(
      readFileSync(join(datasetDir, `${modelId}.json`), 'utf8'),
    ) as { modelType: string; samples: unknown[] };

    expect(dataset.modelType).toBe('static');
    expect(dataset.samples).toHaveLength(RECORDINGS);
    // Sin temporales a medio escribir.
    expect(readdirSync(datasetDir).filter((f) => f.endsWith('.tmp'))).toEqual(
      [],
    );
  });
});
