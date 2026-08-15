import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import {
  applySharedHttpGuards,
  cleanDatabase,
  cookieHeaderFrom,
  createLanguageCurriculum,
  getAdminToken,
  getUserToken,
  validLandmarkFrames,
  type LanguageCurriculum,
} from './test-utils';

function expectNoQuizAnswers(payload: unknown) {
  expect(JSON.stringify(payload)).not.toContain('isCorrect');
}

describe('Critical student flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let userCookie: string;
  let curriculum: LanguageCurriculum;
  let quizId: string;
  let signId: string;
  let correctOptionId: string;
  let incorrectOptionId: string;
  let questionId: string;

  const student = {
    email: 'critical-student@example.com',
    password: 'password123',
    firstName: 'Crit',
    lastName: 'Student',
    age: 21,
    isRightHanded: true,
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
    applySharedHttpGuards(app);
    await app.init();
    dataSource = app.get(DataSource);
    adminToken = await getAdminToken(app, dataSource);
    curriculum = await createLanguageCurriculum(app, adminToken, 'CF');

    await request(app.getHttpServer()).post('/auth/register').send(student);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: student.email, password: student.password })
      .expect(200);
    userToken = login.body.data.token;
    userId = login.body.data.user.id;
    userCookie = cookieHeaderFrom(login);

    const quizRes = await request(app.getHttpServer())
      .post('/quiz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        lessonId: curriculum.lessonId,
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
    quizId = quizRes.body.id;

    const adminQuiz = await request(app.getHttpServer())
      .get(`/quiz/admin/${quizId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    questionId = adminQuiz.body.questions[0].id;
    correctOptionId = adminQuiz.body.questions[0].options.find(
      (option: { isCorrect: boolean }) => option.isCorrect,
    ).id;
    incorrectOptionId = adminQuiz.body.questions[0].options.find(
      (option: { isCorrect: boolean }) => !option.isCorrect,
    ).id;

    const signRes = await request(app.getHttpServer())
      .post('/sign-record/sign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hola',
        languageId: curriculum.languageId,
        lessonId: curriculum.lessonId,
        detectionType: 'static',
      })
      .expect(201);
    signId = signRes.body.id;

    await request(app.getHttpServer())
      .post('/sign-record/landmarks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        signId,
        landmarks: validLandmarkFrames(2),
        dominantHand: 'right',
      })
      .expect(201);
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  describe('auth session', () => {
    it('sets an httpOnly cookie and hydrates GET /users/me', async () => {
      expect(userCookie).toMatch(/lsv_access=/);

      const me = await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', userCookie)
        .expect(200);

      expect(me.body.email).toBe(student.email);
      expect(me.body).not.toHaveProperty('hashPassword');
      expect(me.body.role).toBe('user');
    });

    it('rejects a reset JWT as a session token', async () => {
      const user = await dataSource.getRepository('User').findOneByOrFail({
        email: student.email,
      });
      const tokenService = app.get('TokenService');
      const resetJwt = tokenService.generateToken(user, {
        purpose: 'reset',
        expiresIn: '15m',
      });

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${resetJwt}`)
        .expect(401);
    });
  });

  describe('lesson → quiz without answers → progress', () => {
    it('GET /lesson/:id/with-quizzes hides isCorrect from the student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lesson/${curriculum.lessonId}/with-quizzes`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expectNoQuizAnswers(response.body);
      expect(response.body.quizzes[0].questions[0].options.length).toBe(2);
    });

    it('GET /lesson/:id/quizzes hides isCorrect from the student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lesson/${curriculum.lessonId}/quizzes`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expectNoQuizAnswers(response.body);
      const quizzes = Array.isArray(response.body)
        ? response.body
        : response.body.data;
      expect(quizzes[0].id).toBe(quizId);
    });

    it('GET /quiz/:id hides isCorrect while admin GET keeps it', async () => {
      const studentQuiz = await request(app.getHttpServer())
        .get(`/quiz/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expectNoQuizAnswers(studentQuiz.body);

      await request(app.getHttpServer())
        .get(`/quiz/admin/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      const adminQuiz = await request(app.getHttpServer())
        .get(`/quiz/admin/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(
        adminQuiz.body.questions[0].options.some(
          (option: { isCorrect?: boolean }) => option.isCorrect === true,
        ),
      ).toBe(true);
    });

    it('starts the lesson, scores the quiz, and records completion', async () => {
      await request(app.getHttpServer())
        .post('/user-lesson/start')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lessonId: curriculum.lessonId })
        .expect(201);

      const passed = await request(app.getHttpServer())
        .post(`/quiz/${quizId}/submissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [{ questionId, optionId: correctOptionId }],
        })
        .expect(201);
      expect(passed.body.score).toBe(100);

      const failed = await request(app.getHttpServer())
        .post(`/quiz/${quizId}/submissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [{ questionId, optionId: incorrectOptionId }],
        })
        .expect(201);
      expect(failed.body.score).toBe(0);

      await request(app.getHttpServer())
        .post('/user-lesson/set-lesson-completion')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lessonId: curriculum.lessonId, isComplete: true })
        .expect(201);

      const progress = await request(app.getHttpServer())
        .get(`/user-lesson/by-user/${userId}`)
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(progress.body.data.length).toBeGreaterThan(0);
      expect(
        progress.body.data.some(
          (row: { isCompleted?: boolean }) => row.isCompleted === true,
        ),
      ).toBe(true);
    });
  });

  describe('authorization', () => {
    it('forbids another student from reading this progress', async () => {
      const otherToken = await getUserToken(app, dataSource);

      await request(app.getHttpServer())
        .get(`/user-lesson/by-user/${userId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('moderation vs student', () => {
    it('lets the student list lesson signs but not recordings or training', async () => {
      const signs = await request(app.getHttpServer())
        .get(`/sign-record/lesson/${curriculum.lessonId}/signs`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(
        signs.body.some((sign: { id: string }) => sign.id === signId),
      ).toBe(true);

      await request(app.getHttpServer())
        .get(`/sign-record/sign/${signId}/recordings`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/sign-record/train/${curriculum.lessonVariantId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/sign-record/global')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/sign-record/landmarks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          signId,
          landmarks: validLandmarkFrames(2),
          dominantHand: 'right',
        })
        .expect(403);
    });

    it('blocks /shared/training_data even with a valid token', async () => {
      await request(app.getHttpServer())
        .get('/shared/training_data/secret.json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/shared/training_data/secret.json')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('requires an access token for /shared/models', async () => {
      await request(app.getHttpServer())
        .get('/shared/models/demo/model.json')
        .expect(401);

      await request(app.getHttpServer())
        .get('/shared/models/demo/model.json')
        .query({ access_token: userToken })
        .expect(401);
    });
  });

  describe('logout', () => {
    it('clears the access cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', userCookie);

      expect([200, 201]).toContain(response.status);

      const raw = response.headers['set-cookie'];
      const setCookie = (Array.isArray(raw) ? raw : [raw])
        .map(String)
        .join(';')
        .toLowerCase();
      expect(setCookie).toMatch(/lsv_access=/);
      expect(setCookie).toMatch(/httponly|max-age=0|expires=/);

      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });
});
