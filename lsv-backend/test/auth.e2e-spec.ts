import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase } from './test-utils';
import { OAuthCodeStore } from '../src/auth/infrastructure/oauth-code.store';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testUser = {
    email: 'test-e2e@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    isRightHanded: true,
    role: 'admin',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicamos los mismos pipes que en el main.ts para que los tests sean reales
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  }, 60000);

  beforeEach(async () => {
    // Limpiamos la base de datos antes de cada test
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 60000);

  describe('/auth/register (POST)', () => {
    it('Should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.message).toBe('Usuario registrado correctamente');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('Should ignore an attempted admin role on register', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'cannot-be-admin@example.com',
          role: 'admin',
        })
        .expect(201);

      expect(response.body.data.user.role).toBe('user');

      const token = response.body.data.token;
      const me = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(me.body.role).toBe('user');
    });

    it('Should fail when registering an existing email', async () => {
      // Primero registramos uno
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // Intentamos registrar el mismo - Tu API devuelve 409 Conflict
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('Should login and return a JWT token', async () => {
      // 1. Registro previo
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // 2. Login - Tu API devuelve 200 OK
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.message).toBe('Inicio de sesión exitoso');
      expect(response.body.data).toHaveProperty('token');
    });

    it('Should return English login message when Accept-Language is en', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'login-en@example.com',
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept-Language', 'en')
        .send({
          email: 'login-en@example.com',
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.message).toBe('User logged in successfully');
    });

    it('Should fail with incorrect password', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('Should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'non-existent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('Should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/users/me (GET)', () => {
    it('Should get user profile with a valid token', async () => {
      // 1. Registro
      const regResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          role: 'user',
          email: `profile-${Date.now()}@example.com`,
        })
        .expect(201);

      const token = regResponse.body.data.token;

      // 2. Consulta de perfil usando el token
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).not.toHaveProperty('hashPassword');
    });

    it('Should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('Should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer invalid-token`)
        .expect(401);
    });

    it('Should not elevate role via PUT /users/me', async () => {
      const regResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          role: 'admin',
          email: `no-elevate-${Date.now()}@example.com`,
        })
        .expect(201);

      const token = regResponse.body.data.token;

      const updated = await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane',
          role: 'admin',
        })
        .expect(200);

      expect(updated.body.role).toBe('user');
      expect(updated.body.firstName).toBe('Jane');
    });
  });

  describe('/auth/password/reset (POST)', () => {
    const resetMessage =
      'Si el correo existe, se ha enviado un enlace de restablecimiento.';

    it('Should return the same message for an unknown email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({ email: 'missing-user@example.com' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.message).toBe(resetMessage);
    });

    it('Should return the same message for an existing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'reset-known@example.com',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({ email: 'reset-known@example.com' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.message).toBe(resetMessage);
    });
  });

  describe('/auth/google/exchange (POST)', () => {
    it('Should reject a short code', async () => {
      await request(app.getHttpServer())
        .post('/auth/google/exchange')
        .send({ code: 'short' })
        .expect(400);
    });

    it('Should reject an unknown code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google/exchange')
        .send({ code: 'x'.repeat(32) })
        .expect(401);

      expect(response.body.message).toBe('Código OAuth inválido o expirado');
    });

    it('Should consume a code only once', async () => {
      const store = app.get(OAuthCodeStore);
      const code = await store.create('e2e-oauth-access-token', {
        id: 'oauth-user',
      });

      const first = await request(app.getHttpServer())
        .post('/auth/google/exchange')
        .send({ code });

      expect([200, 201]).toContain(first.status);
      expect(first.body.data.token).toBe('e2e-oauth-access-token');

      await request(app.getHttpServer())
        .post('/auth/google/exchange')
        .send({ code })
        .expect(401);
    });
  });
});
