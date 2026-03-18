import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Regions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let languageId: string;
  let regionId: string;

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

    const langRes = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Region Lang', description: 'Test', countryCode: 'US' })
      .expect(201);
    languageId = langRes.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  });

  describe('Region Operations', () => {
    it('/region (POST) - Should create a region', async () => {
      const response = await request(app.getHttpServer())
        .post('/region')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Metropolitana',
          code: 'RM',
          description: 'Zona centro',
          isDefault: false,
          languageId: languageId,
        })
        .expect(201);

      expect(response.body.name).toBe('Metropolitana');
      regionId = response.body.id;
    });

    it('/region (GET) - Should list regions', async () => {
      const response = await request(app.getHttpServer())
        .get('/region')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ languageId })
        .expect(200);

      expect(response.body.data.some((r) => r.id === regionId)).toBe(true);
    });

    it('/region/countries (GET) - Should list countries', async () => {
      const response = await request(app.getHttpServer())
        .get('/region/countries')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ name: 'United' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/region/:id (PUT) - Should update region', async () => {
      const response = await request(app.getHttpServer())
        .put(`/region/${regionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Metropolitana Updated',
          code: 'RMU',
          description: 'Zona centro editada',
          languageId: languageId,
        })
        .expect(200);

      expect(response.body.name).toBe('Metropolitana Updated');
    });

    it('/region/:id (DELETE) - Should delete region', async () => {
      await request(app.getHttpServer())
        .delete(`/region/${regionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
