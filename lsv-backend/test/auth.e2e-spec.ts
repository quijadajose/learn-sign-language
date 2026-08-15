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

  async function loginToken(email: string, password = testUser.password) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.data.token as string;
  }

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
      expect(response.body.data?.token).toBeUndefined();
      expect(response.headers['set-cookie']).toBeUndefined();

      const token = await loginToken(testUser.email);
      const me = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(me.body.email).toBe(testUser.email);
      expect(me.body.role).toBe('user');
    });

    it('Should ignore an attempted admin role on register', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'cannot-be-admin@example.com',
          role: 'admin',
        })
        .expect(201);

      const token = await loginToken('cannot-be-admin@example.com');
      const me = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(me.body.role).toBe('user');
    });

    it('Should not reveal whether an email is already registered', async () => {
      const first = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(first.body.message).toBe(second.body.message);
      expect(first.body.data?.token).toBeUndefined();
      expect(second.body.data?.token).toBeUndefined();
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
      const email = `profile-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          role: 'user',
          email,
        })
        .expect(201);

      const token = await loginToken(email);

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

    it('Should reject role elevation via PUT /users/me', async () => {
      const email = `no-elevate-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          role: 'admin',
          email,
        })
        .expect(201);

      const token = await loginToken(email);

      await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane',
          role: 'admin',
        })
        .expect(400);
    });

    it('Should reject hashPassword on PUT /users/me', async () => {
      const email = `no-hash-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email,
        })
        .expect(201);

      await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${await loginToken(email)}`)
        .send({ hashPassword: 'not-a-hash' })
        .expect(400);
    });

    it('Should update firstName without changing role', async () => {
      const email = `rename-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email,
        })
        .expect(201);

      const updated = await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${await loginToken(email)}`)
        .send({ firstName: 'Jane' })
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

  describe('JWT purpose and session invalidation', () => {
    it('Should set an httpOnly access cookie on login', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'cookie-login@example.com',
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'cookie-login@example.com',
          password: testUser.password,
        })
        .expect(200);

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const header = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
      expect(header).toMatch(/lsv_access=/);
      expect(header.toLowerCase()).toMatch(/httponly/);
    });

    it('Should authenticate GET /users/me with the access cookie', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'cookie-me@example.com',
        });
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'cookie-me@example.com',
          password: testUser.password,
        })
        .expect(200);

      const raw = login.headers['set-cookie'];
      const cookieHeader = (Array.isArray(raw) ? raw : [raw])
        .map((c) => String(c).split(';')[0])
        .join('; ');

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', cookieHeader)
        .expect(200);
    });

    it('Should not accept a login JWT as a password-reset token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'purpose-login@example.com',
        })
        .expect(201);

      const token = await loginToken('purpose-login@example.com');

      await request(app.getHttpServer())
        .post('/auth/password/reset/confirm')
        .send({
          token,
          newPassword: 'brandNewPass1',
        })
        .expect(400);
    });

    it('Should not accept a reset JWT as a session token', async () => {
      const email = 'purpose-reset@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email })
        .expect(201);

      const user = await dataSource.getRepository('User').findOneByOrFail({
        email,
      });
      const tokenService = app.get('TokenService');
      const resetJwt = tokenService.generateToken(user, {
        purpose: 'reset',
        expiresIn: '15m',
      });

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${resetJwt}`)
        .expect(401);
    });

    it('Should reject the previous JWT after a password change', async () => {
      const email = 'rotate-token@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email })
        .expect(201);
      const oldToken = await loginToken(email);

      await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: 'rotatedPass1',
        })
        .expect(200);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${oldToken}`)
        .expect(401);
    });
  });
});
