import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { DataSource } from 'typeorm';
import {
  cleanDatabase,
  createLanguageCurriculum,
  getAdminToken,
  getModeratorToken,
  validLandmarkFrames,
  type LanguageCurriculum,
} from './test-utils.js';

/**
 * BE-06: un moderador del idioma A no puede mover recursos a otro idioma ni
 * asociarlos con recursos del idioma B usando IDs en el body.
 *
 * Cada ataque se hace con el token del moderador de A y después se comprueba en la
 * base de datos que nada cambió de idioma.
 */
describe('Language isolation for moderators (BE-06, e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let modA: string;
  let a: LanguageCurriculum;
  let b: LanguageCurriculum;
  let quizAId: string;
  let signAId: string;

  const http = () => request(app.getHttpServer());
  const asModA = <T extends { set: (k: string, v: string) => T }>(req: T) =>
    req.set('Authorization', `Bearer ${modA}`);

  /** 400 (validación del use case) o 403 (guard): lo importante es que no pase. */
  const expectRejected = (status: number) =>
    expect([400, 403]).toContain(status);

  const languageOf = async (
    table: 'lesson' | 'stages' | 'region' | 'sign',
    id: string,
  ): Promise<string | null> => {
    const rows: Array<{ languageId: string | null }> = await dataSource.query(
      `SELECT "languageId" FROM "${table}" WHERE id = $1`,
      [id],
    );
    return rows[0]?.languageId ?? null;
  };

  beforeAll(async () => {
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
    a = await createLanguageCurriculum(app, adminToken, 'ISO-A');
    b = await createLanguageCurriculum(app, adminToken, 'ISO-B');
    modA = await getModeratorToken(
      app,
      dataSource,
      adminToken,
      'language',
      a.languageId,
    );

    const quiz = await http()
      .post('/quiz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        lessonId: a.lessonId,
        questions: [
          {
            text: '¿Qué seña es esta?',
            options: [
              { text: 'Hola', isCorrect: true },
              { text: 'Adiós', isCorrect: false },
            ],
          },
        ],
      })
      .expect(201);
    quizAId = quiz.body.id ?? quiz.body.data?.id;

    const sign = await http()
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hola',
        languageId: a.languageId,
        lessonId: a.lessonId,
        detectionType: 'static',
      })
      .expect(201);
    signAId = sign.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  it('control: the moderator can edit a lesson of its own language', async () => {
    await asModA(http().put(`/lesson/${a.lessonId}`))
      .send({
        name: 'ISO-A Lesson editada',
        description: 'e2e',
        content: 'e2e',
        languageId: a.languageId,
        stageId: a.stageId,
      })
      .expect(200);
  });

  it('control: the moderator cannot touch a lesson of language B directly', async () => {
    const res = await asModA(http().put(`/lesson/${b.lessonId}`)).send({
      name: 'hack',
      description: 'e2e',
      content: 'e2e',
      languageId: b.languageId,
      stageId: b.stageId,
    });
    expect(res.status).toBe(403);
  });

  describe('PUT /lesson/:id', () => {
    it('rejects moving the lesson to language B', async () => {
      const res = await asModA(http().put(`/lesson/${a.lessonId}`)).send({
        name: 'moved',
        description: 'e2e',
        content: 'e2e',
        languageId: b.languageId,
        stageId: b.stageId,
      });
      expectRejected(res.status);
      expect(await languageOf('lesson', a.lessonId)).toBe(a.languageId);
    });

    it('rejects attaching the lesson to a stage of language B', async () => {
      const res = await asModA(http().put(`/lesson/${a.lessonId}`)).send({
        name: 'moved',
        description: 'e2e',
        content: 'e2e',
        languageId: a.languageId,
        stageId: b.stageId,
      });
      expectRejected(res.status);
      const rows: Array<{ stageId: string }> = await dataSource.query(
        'SELECT "stageId" FROM lesson WHERE id = $1',
        [a.lessonId],
      );
      expect(rows[0].stageId).toBe(a.stageId);
    });
  });

  it('POST /lesson rejects a stage of language B', async () => {
    const res = await asModA(http().post('/lesson')).send({
      name: 'ISO cross-stage lesson',
      description: 'e2e',
      content: 'e2e',
      languageId: a.languageId,
      stageId: b.stageId,
    });
    expectRejected(res.status);
    const rows: unknown[] = await dataSource.query(
      'SELECT id FROM lesson WHERE name = $1',
      ['ISO cross-stage lesson'],
    );
    expect(rows).toHaveLength(0);
  });

  it('PUT /stage/:id rejects moving the stage to language B', async () => {
    const res = await asModA(http().put(`/stage/${a.stageId}`)).send({
      name: 'moved',
      description: 'e2e',
      languageId: b.languageId,
    });
    expectRejected(res.status);
    expect(await languageOf('stages', a.stageId)).toBe(a.languageId);
  });

  it('PUT /region/:id rejects moving the region to language B', async () => {
    const res = await asModA(http().put(`/region/${a.regionId}`)).send({
      name: 'moved',
      code: 'ISOMV',
      description: 'e2e',
      languageId: b.languageId,
    });
    expectRejected(res.status);
    expect(await languageOf('region', a.regionId)).toBe(a.languageId);
  });

  it('PUT /quiz/:id rejects moving the quiz to a lesson of language B', async () => {
    const res = await asModA(http().put(`/quiz/${quizAId}`)).send({
      lessonId: b.lessonId,
      questions: [
        {
          text: 'moved',
          options: [
            { text: 'x', isCorrect: true },
            { text: 'y', isCorrect: false },
          ],
        },
      ],
    });
    expectRejected(res.status);
    const rows: Array<{ lessonId: string }> = await dataSource.query(
      'SELECT "lessonId" FROM quiz WHERE id = $1',
      [quizAId],
    );
    expect(rows[0].lessonId).toBe(a.lessonId);
  });

  it('POST /sign-record/sign rejects a lesson of language B', async () => {
    const res = await asModA(http().post('/sign-record/sign')).send({
      name: 'ISO cross sign',
      languageId: a.languageId,
      lessonId: b.lessonId,
      detectionType: 'static',
    });
    expectRejected(res.status);
    const rows: unknown[] = await dataSource.query(
      'SELECT id FROM sign WHERE name = $1',
      ['ISO cross sign'],
    );
    expect(rows).toHaveLength(0);
  });

  it('POST /sign-record/signs rejects a lesson of language B', async () => {
    const res = await asModA(http().post('/sign-record/signs')).send({
      languageId: a.languageId,
      lessonId: b.lessonId,
      signs: [{ name: 'ISO cross bulk', detectionType: 'static' }],
    });
    expectRejected(res.status);
    const rows: unknown[] = await dataSource.query(
      'SELECT id FROM sign WHERE name = $1',
      ['ISO cross bulk'],
    );
    expect(rows).toHaveLength(0);
  });

  it('POST /sign-record/landmarks rejects a region of language B', async () => {
    const before: Array<{ n: string }> = await dataSource.query(
      'SELECT COUNT(*)::text AS n FROM sign_recording',
    );
    const res = await asModA(http().post('/sign-record/landmarks')).send({
      signId: signAId,
      regionId: b.regionId,
      landmarks: validLandmarkFrames(2),
      dominantHand: 'right',
    });
    expectRejected(res.status);
    const after: Array<{ n: string }> = await dataSource.query(
      'SELECT COUNT(*)::text AS n FROM sign_recording',
    );
    expect(after[0].n).toBe(before[0].n);
    expect(await languageOf('sign', signAId)).toBe(a.languageId);
  });
});
