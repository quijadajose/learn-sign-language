import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('User Lessons (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let userId: string;
  let lessonId: string;

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
    const adminToken = await getAdminToken(app, dataSource);

    const langRes = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ULang', description: 'Test', countryCode: 'US' });
    const stageRes = await request(app.getHttpServer())
      .post('/stage')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UStage',
        description: 'Test',
        languageId: langRes.body.id,
      });
    const lessonRes = await request(app.getHttpServer())
      .post('/lesson')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'ULesson',
        description: 'Test',
        content: 'Test',
        languageId: langRes.body.id,
        stageId: stageRes.body.id,
      });
    lessonId = lessonRes.body.id;

    const testUser = {
      email: 'user-ulesson@example.com',
      password: 'password123',
      firstName: 'U',
      lastName: 'L',
      age: 20,
      isRightHanded: true,
    };
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);
    userId = regRes.body.data.user.id;
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    userToken = loginRes.body.data.token;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  });

  it('/user-lesson/start (POST) - Should start a lesson', async () => {
    await request(app.getHttpServer())
      .post('/user-lesson/start')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ lessonId })
      .expect(201);
  });

  it('/user-lesson/set-lesson-completion (POST) - Should complete a lesson', async () => {
    await request(app.getHttpServer())
      .post('/user-lesson/set-lesson-completion')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ lessonId, isComplete: true })
      .expect(201);
  });

  it('/user-lesson/by-user/:id (GET) - Should return user lessons', async () => {
    const response = await request(app.getHttpServer())
      .get(`/user-lesson/by-user/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
