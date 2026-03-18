import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Quizzes (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let lessonId: string;
  let quizId: string;

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

    // Prep data
    const langRes = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Quiz Lang', description: 'Test', countryCode: 'US' });
    const stageRes = await request(app.getHttpServer())
      .post('/stage')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Quiz Stage',
        description: 'Test',
        languageId: langRes.body.id,
      });
    const lessonRes = await request(app.getHttpServer())
      .post('/lesson')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Quiz Lesson',
        description: 'Test',
        content: 'Test',
        languageId: langRes.body.id,
        stageId: stageRes.body.id,
      });
    lessonId = lessonRes.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  describe('Quiz CRUD', () => {
    it('/quiz (POST) - Should create a quiz', async () => {
      const quizData = {
        lessonId: lessonId,
        questions: [
          {
            text: '¿Qué seña es esta?',
            options: [
              { text: 'Opción 1', isCorrect: true },
              { text: 'Opción 2', isCorrect: false },
            ],
          },
        ],
      };
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(quizData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      quizId = response.body.id;

      // Deep validation: Fetch it back and check structure
      const fetchRes = await request(app.getHttpServer())
        .get(`/quiz/admin/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(fetchRes.body.questions.length).toBe(1);
      expect(fetchRes.body.questions[0].text).toBe(quizData.questions[0].text);
      expect(fetchRes.body.questions[0].options.length).toBe(2);
    });

    it('/quiz/:quizId/submission (POST) - Should calculate correct score', async () => {
      const quiz = await request(app.getHttpServer())
        .get(`/quiz/admin/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const questionId = quiz.body.questions[0].id;
      const correctOptionId = quiz.body.questions[0].options.find(
        (o) => o.isCorrect,
      ).id;
      const incorrectOptionId = quiz.body.questions[0].options.find(
        (o) => !o.isCorrect,
      ).id;

      // Test 100% score
      const resCorrect = await request(app.getHttpServer())
        .post(`/quiz/${quizId}/submissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          answers: [{ questionId, optionId: correctOptionId }],
        })
        .expect(201);
      expect(resCorrect.body.score).toBe(100);

      // Test 0% score
      const resIncorrect = await request(app.getHttpServer())
        .post(`/quiz/${quizId}/submissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          answers: [{ questionId, optionId: incorrectOptionId }],
        })
        .expect(201);
      expect(resIncorrect.body.score).toBe(0);
    });

    it('/quiz (POST) - Should FAIL with overlapping options (Invalid Data)', async () => {
      await request(app.getHttpServer())
        .post('/quiz')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lessonId: lessonId,
          questions: [
            {
              text: 'Invalid Question',
              options: [], // Should fail validation if empty
            },
          ],
        })
        .expect(400);
    });

    it('/quiz/:id (DELETE) - Should delete quiz', async () => {
      await request(app.getHttpServer())
        .delete(`/quiz/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
