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

  it('GET /health/database requires authentication', async () => {
    await request(app.getHttpServer()).get('/health/database').expect(401);
  });

  it('GET /health/valkey requires authentication', async () => {
    await request(app.getHttpServer()).get('/health/valkey').expect(401);
  });

  it('GET /health/ssl requires authentication', async () => {
    await request(app.getHttpServer()).get('/health/ssl').expect(401);
  });

  it('GET /health/domain requires authentication', async () => {
    await request(app.getHttpServer()).get('/health/domain').expect(401);
  });
});
