import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Languages (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let createdLanguageId: string;

  const testLanguage = {
    name: 'Lenguaje de Prueba',
    description: 'Una descripción para el lenguaje de prueba',
    countryCode: 'US',
  };

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
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  describe('CRUD Operations', () => {
    it('/languages (POST) - Should fail without token', async () => {
      await request(app.getHttpServer())
        .post('/languages')
        .send(testLanguage)
        .expect(401);
    });

    it('/languages (POST) - Should create a new language as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testLanguage)
        .expect(201);

      expect(response.body.name).toBe(testLanguage.name);
      expect(response.body).toHaveProperty('id');
      createdLanguageId = response.body.id;
    });

    it('/languages (GET) - Should list all languages', async () => {
      const response = await request(app.getHttpServer())
        .get('/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('/languages/:id (GET) - Should get a language by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/languages/${createdLanguageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdLanguageId);
      expect(response.body.name).toBe(testLanguage.name);
    });

    it('/languages/:id (PUT) - Should update language information', async () => {
      const updatedData = { ...testLanguage, name: 'Lenguaje Actualizado' };
      const response = await request(app.getHttpServer())
        .put(`/languages/${createdLanguageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.name).toBe(updatedData.name);
    });

    it('/languages/:id (DELETE) - Should remove the language', async () => {
      await request(app.getHttpServer())
        .delete(`/languages/${createdLanguageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verificar que ya no existe (debería dar 404)
      await request(app.getHttpServer())
        .get(`/languages/${createdLanguageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
