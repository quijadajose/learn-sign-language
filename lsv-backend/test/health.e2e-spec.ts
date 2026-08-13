import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Health (e2e smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 60000);

  it('GET /health/api is up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/api')
      .expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /health/database is up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/database')
      .expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /health/valkey is up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/valkey')
      .expect(200);
    expect(response.body.status).toBe('ok');
  });
});
