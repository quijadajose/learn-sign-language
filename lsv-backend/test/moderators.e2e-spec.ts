import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken, getUserToken } from './test-utils';

describe('Moderators (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let targetUserId: string;
  let languageId: string;
  let permissionId: string;

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

    // Prep target user and language
    const testUser = {
      email: 'mod-user@example.com',
      password: 'password123',
      firstName: 'Mod',
      lastName: 'User',
      age: 20,
      isRightHanded: true,
    };
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);
    if (regRes.status !== 201) {
      console.log('Registration failed:', regRes.status, regRes.body);
    } else {
      console.log('Registration success:', regRes.body);
    }
    targetUserId = regRes.body.data.user.id;

    const langRes = await request(app.getHttpServer())
      .post('/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mod Lang', description: 'Test', countryCode: 'US' });
    languageId = langRes.body.id;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await cleanDatabase(dataSource);
      await app.close();
    }
  });

  describe('Moderator Permissions', () => {
    it('/admin/moderators (POST) - Should assign moderator permission', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/moderators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: targetUserId,
          scope: 'language',
          targetId: languageId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      permissionId = response.body.id;
    });

    it('/admin/moderators (POST) - Should FAIL if not admin', async () => {
      const userToken = await getUserToken(app, dataSource);
      await request(app.getHttpServer())
        .post('/admin/moderators')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: targetUserId,
          scope: 'language',
          targetId: languageId,
        })
        .expect(403);
    });

    it('/admin/moderators (GET) - Should list moderators', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/moderators')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/admin/moderators (GET) - Should FAIL if not admin', async () => {
      const userToken = await getUserToken(app, dataSource);
      await request(app.getHttpServer())
        .get('/admin/moderators')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('/admin/moderators/users/search (GET) - Should search for users', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/moderators/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ q: 'mod-user@example.com' })
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
    });

    it('/admin/moderators/:id (DELETE) - Should revoke permission', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/moderators/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('/admin/moderators/:id (DELETE) - Should FAIL if not admin', async () => {
      const userToken = await getUserToken(app, dataSource);
      await request(app.getHttpServer())
        .delete(`/admin/moderators/${permissionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
