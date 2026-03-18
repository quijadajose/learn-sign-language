import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Stages (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let languageId: string;
  let stageId: string;

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

    // Crear lenguaje de base
    const res = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Stage Lang', description: 'Test', countryCode: 'US' })
      .expect(201);
    languageId = res.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  });

  describe('CRUD Operations', () => {
    it('/stage (POST) - Should create a stage', async () => {
      const response = await request(app.getHttpServer())
        .post('/stage')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Introducción',
          description: 'Nivel básico',
          languageId: languageId,
        })
        .expect(201);

      expect(response.body.name).toBe('Introducción');
      stageId = response.body.id;
    });

    it('/stage/:id (GET) - Should list stages for a language', async () => {
      const response = await request(app.getHttpServer())
        .get(`/stage/${languageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('/stage/:id (PUT) - Should update stage', async () => {
      await request(app.getHttpServer())
        .put(`/stage/${stageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Introducción Actualizada',
          description: 'Nivel básico revisado',
          languageId: languageId,
        })
        .expect(204); // StageController.update devuelve void (204)
    });

    it('/stage/:id (DELETE) - Should delete stage', async () => {
      await request(app.getHttpServer())
        .delete(`/stage/${stageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
