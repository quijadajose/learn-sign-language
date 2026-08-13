import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import {
  cleanDatabase,
  createLanguageCurriculum,
  getAdminToken,
  getModeratorToken,
  getUserToken,
  validLandmarkFrames,
  type LanguageCurriculum,
} from './test-utils';

describe('SignRecord (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let curriculumA: LanguageCurriculum;
  let curriculumB: LanguageCurriculum;
  let moderatorAToken: string;
  let signId: string;

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
    userToken = await getUserToken(app, dataSource);
    curriculumA = await createLanguageCurriculum(app, adminToken, 'SR-A');
    curriculumB = await createLanguageCurriculum(app, adminToken, 'SR-B');
    moderatorAToken = await getModeratorToken(
      app,
      dataSource,
      adminToken,
      'language',
      curriculumA.languageId,
    );
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  it('GET /sign-record/global requires auth', async () => {
    await request(app.getHttpServer()).get('/sign-record/global').expect(401);
  });

  it('GET /sign-record/global returns data for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/sign-record/global')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('GET /sign-record/global forbids regular users', async () => {
    await request(app.getHttpServer())
      .get('/sign-record/global')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /sign-record/models requires moderator/admin', async () => {
    await request(app.getHttpServer()).get('/sign-record/models').expect(401);

    const response = await request(app.getHttpServer())
      .get('/sign-record/models')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('POST /sign-record/landmarks validates payload', async () => {
    await request(app.getHttpServer())
      .post('/sign-record/landmarks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ signId: 'not-a-uuid', landmarks: [] })
      .expect(400);
  });

  it('POST /sign-record/sign creates a sign as admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hola',
        languageId: curriculumA.languageId,
        lessonId: curriculumA.lessonId,
        detectionType: 'static',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Hola');
    signId = response.body.id;
  });

  it('GET /sign-record/lesson/:id/signs is available to a regular user', async () => {
    const response = await request(app.getHttpServer())
      .get(`/sign-record/lesson/${curriculumA.lessonId}/signs`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(
      response.body.some((sign: { id: string }) => sign.id === signId),
    ).toBe(true);
  });

  it('POST /sign-record/signs creates signs in bulk', async () => {
    const response = await request(app.getHttpServer())
      .post('/sign-record/signs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        languageId: curriculumA.languageId,
        lessonId: curriculumA.lessonId,
        signs: [
          { name: 'Adiós', detectionType: 'static' },
          { name: 'Gracias', detectionType: 'dynamic' },
        ],
      })
      .expect(201);

    expect(Array.isArray(response.body.created)).toBe(true);
    expect(response.body.created.length).toBe(2);
    expect(response.body.skipped).toEqual([]);
  });

  it('POST /sign-record/landmarks accepts a valid contract payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/sign-record/landmarks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        signId,
        landmarks: validLandmarkFrames(2),
        dominantHand: 'right',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.isValidated).toBe(true);
  });

  it('GET /sign-record/sign/:id/recordings returns saved frames', async () => {
    const response = await request(app.getHttpServer())
      .get(`/sign-record/sign/${signId}/recordings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('POST /sign-record/landmarks rejects wrong feature length', async () => {
    await request(app.getHttpServer())
      .post('/sign-record/landmarks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        signId,
        landmarks: [[0, 1, 2]],
      })
      .expect(400);
  });

  it('POST /sign-record/train/:variantId returns 404 without recordings', async () => {
    const empty = await createLanguageCurriculum(app, adminToken, 'SR-empty');
    const response = await request(app.getHttpServer())
      .post(`/sign-record/train/${empty.lessonVariantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.message).toBe(
      'No hay grabaciones validadas para entrenar esta lección',
    );
  });

  it('POST /sign-record/sign forbids a regular user', async () => {
    await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Forbidden',
        languageId: curriculumA.languageId,
        lessonId: curriculumA.lessonId,
      })
      .expect(403);
  });

  it('moderator of language A can create a sign in A', async () => {
    const response = await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${moderatorAToken}`)
      .send({
        name: 'Mod A',
        languageId: curriculumA.languageId,
        lessonId: curriculumA.lessonId,
      })
      .expect(201);

    expect(response.body.name).toBe('Mod A');
  });

  it('moderator of language A cannot create a sign in B', async () => {
    await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${moderatorAToken}`)
      .send({
        name: 'Mod B leak',
        languageId: curriculumB.languageId,
        lessonId: curriculumB.lessonId,
      })
      .expect(403);
  });
});
