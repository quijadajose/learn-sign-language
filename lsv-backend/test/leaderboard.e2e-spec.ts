import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { DataSource } from 'typeorm';
import {
  accessTokenFromAuthResponse,
  cleanDatabase,
  createLanguageCurriculum,
  findUserIdByEmail,
  getAdminToken,
} from './test-utils.js';

describe('Leaderboard (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let languageId: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    dataSource = app.get(DataSource);

    adminToken = await getAdminToken(app, dataSource);

    // Prep user and language
    const testUser = {
      email: 'leader-user@example.com',
      password: 'password123',
      firstName: 'Leader',
      lastName: 'User',
      age: 20,
      isRightHanded: true,
    };
    await request(app.getHttpServer()).post('/auth/register').send(testUser);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    userToken = accessTokenFromAuthResponse(loginRes);

    const langRes = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Leader Lang', description: 'Test', countryCode: 'US' });
    languageId = langRes.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  });

  it('/leaderboard (GET) - Should return general leaderboard', async () => {
    const response = await request(app.getHttpServer())
      .get('/leaderboard')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });

  it('/leaderboard/language/:id (GET) - Should return language specific leaderboard', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leaderboard/language/${languageId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });

  // BE-07: el total debe ser la suma del mejor puntaje por quiz, sin
  // multiplicarse por el número de envíos, y la paginación debe recortar filas.
  it('/leaderboard (GET) - suma el máximo por quiz y pagina (BE-07)', async () => {
    const http = request(app.getHttpServer());
    const curriculum = await createLanguageCurriculum(app, adminToken, 'BE07');

    const repeater = {
      email: 'be07-repeater@example.com',
      password: 'password123',
      firstName: 'Repite',
      lastName: 'Mucho',
      age: 20,
      isRightHanded: true,
    };
    const once = {
      ...repeater,
      email: 'be07-once@example.com',
      firstName: 'Una',
      lastName: 'Vez',
    };
    await http.post('/auth/register').send(repeater).expect(201);
    await http.post('/auth/register').send(once).expect(201);
    const repeaterId = await findUserIdByEmail(dataSource, repeater.email);
    const onceId = await findUserIdByEmail(dataSource, once.email);

    const [{ id: quizA }] = await dataSource.query(
      'INSERT INTO "quiz" ("lessonId") VALUES ($1) RETURNING "id"',
      [curriculum.lessonId],
    );
    const [{ id: quizB }] = await dataSource.query(
      'INSERT INTO "quiz" ("lessonId") VALUES ($1) RETURNING "id"',
      [curriculum.lessonId],
    );
    const submit = (userId: string, quizId: string, score: number) =>
      dataSource.query(
        'INSERT INTO "quiz_submission" ("userId", "quizId", "score") VALUES ($1, $2, $3)',
        [userId, quizId, score],
      );
    // Mejor de A = 100 (enviado 3 veces) + mejor de B = 50 → 150.
    // Con el bug, el 100 se contaba 3 veces y el total salía 350.
    await submit(repeaterId, quizA, 80);
    await submit(repeaterId, quizA, 100);
    await submit(repeaterId, quizA, 100);
    await submit(repeaterId, quizB, 50);
    await submit(onceId, quizA, 90);

    const firstPage = await http
      .get(`/leaderboard/language/${curriculum.languageId}`)
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(firstPage.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(firstPage.body.data).toEqual([
      {
        userId: repeaterId,
        firstName: 'Repite',
        lastName: 'Mucho',
        totalScore: 150,
      },
    ]);

    const secondPage = await http
      .get(`/leaderboard/language/${curriculum.languageId}`)
      .query({ page: 2, limit: 1 })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(secondPage.body.data).toEqual([
      { userId: onceId, firstName: 'Una', lastName: 'Vez', totalScore: 90 },
    ]);

    const general = await http
      .get('/leaderboard')
      .query({ limit: 100 })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(general.body.data.length).toBeLessThanOrEqual(100);
    const repeaterRow = general.body.data.find(
      (row: { userId: string }) => row.userId === repeaterId,
    );
    expect(repeaterRow?.totalScore).toBe(150);
  });

  it('/leaderboard (GET) - rechaza páginas mayores al máximo (BE-07)', async () => {
    await request(app.getHttpServer())
      .get('/leaderboard')
      .query({ limit: 101 })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);
  });
});
