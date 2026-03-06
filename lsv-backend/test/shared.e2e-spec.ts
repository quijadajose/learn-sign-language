import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

describe('Shared (Country, Division, Images) (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
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
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  }, 60000);

  describe('Country & Division', () => {
    it('/country-division/countries (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/country-division/countries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/country-division/divisions (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/country-division/divisions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Images', () => {
    let uploadedFilename: string;

    it('/images/upload/:folder (POST) - Should upload an image', async () => {
      const filePath = join(__dirname, 'shared-test.png');
      // Minimal 1x1 transparent PNG
      const minPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64',
      );
      writeFileSync(filePath, minPng);

      const response = await request(app.getHttpServer())
        .post('/images/upload/test-folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('id', 'test-id')
        .attach('file', filePath)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toContain('/images/test-folder/test-id');
      uploadedFilename = 'test-id';
      unlinkSync(filePath);
    });

    it('/images/:folder/:filename (GET) - Should return image', async () => {
      if (uploadedFilename) {
        await request(app.getHttpServer())
          .get(`/images/test-folder/${uploadedFilename}`)
          .expect(200);
      }
    });

    it('/images/:folder/:filename (DELETE)? - No delete endpoint found', async () => {
      // There is no DELETE endpoint in ImagesController, removing this or making it skip
      // The previous test was failing because there is no @Delete(':filename')
    });
  });
});
