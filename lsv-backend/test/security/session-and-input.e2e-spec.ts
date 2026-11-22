import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { securityHeaders } from '../../src/config/security-headers.js';
import { requireTrustedOrigin } from '../../src/config/trusted-origin.js';
import {
  accessTokenFromAuthResponse,
  applySharedHttpGuards,
  cookieHeaderFrom,
  getAdminToken,
} from '../test-utils.js';

/**
 * S2 (sesión), S3 (entrada) y S4 (subidas y rutas de archivos), como sondas contra la
 * app real en la base de test. Cada `it` describe un control concreto: si falla, es un
 * hallazgo con su evidencia (el test dice qué se esperaba y qué llegó).
 *
 * Los mismos middlewares que `main.ts` se montan aquí (cabeceras, Origin de cookies y
 * guards de /shared), porque AppModule no los incluye.
 */

const PASSWORD = 'password123';

const b64url = (v: unknown) =>
  Buffer.from(JSON.stringify(v))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

describe('Sesión, entrada y archivos (S2-S4, e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userEmail: string;
  let userToken: string;
  let userCookie: string;

  const http = () => request(app.getHttpServer());

  /** Sube un archivo a la carpeta `user` como el propio alumno (el controlador exige su id). */
  const uploadAsSelf = async (
    file: Buffer,
    filename: string,
    contentType: string,
  ) => {
    const token = await freshUserToken();
    const me = await http()
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return http()
      .post('/images/upload/user')
      .set('Authorization', `Bearer ${await freshUserToken()}`)
      .field('id', me.body.id as string)
      .attach('file', file, { filename, contentType });
  };

  /** Un logout invalida todas las sesiones del usuario (tokenVersion): cada prueba entra de nuevo. */
  const freshUserToken = async (): Promise<string> =>
    accessTokenFromAuthResponse(
      await http()
        .post('/auth/login')
        .send({ email: userEmail, password: PASSWORD })
        .expect(200),
    );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(securityHeaders);
    app.use(requireTrustedOrigin);
    applySharedHttpGuards(app);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(0);
    dataSource = app.get(DataSource);
    await getAdminToken(app, dataSource);

    userEmail = `sesion-user-${Date.now()}@example.com`;
    await http()
      .post('/auth/register')
      .send({
        email: userEmail,
        password: PASSWORD,
        firstName: 'Sesion',
        lastName: 'Alumno',
        age: 25,
        isRightHanded: true,
      })
      .expect(201);
    const login = await http()
      .post('/auth/login')
      .send({ email: userEmail, password: PASSWORD })
      .expect(200);
    userToken = accessTokenFromAuthResponse(login);
    userCookie = cookieHeaderFrom(login);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('S2: sesión y autenticación', () => {
    it('la cookie de acceso es HttpOnly y SameSite=Lax', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: userEmail, password: PASSWORD })
        .expect(200);
      const raw = String(res.headers['set-cookie'] ?? '');
      expect(raw).toContain('lsv_access=');
      expect(raw).toMatch(/HttpOnly/i);
      expect(raw).toMatch(/SameSite=Lax/i);
    });

    it('el logout invalida el token que se estaba usando', async () => {
      const login = await http()
        .post('/auth/login')
        .send({ email: userEmail, password: PASSWORD })
        .expect(200);
      const token = accessTokenFromAuthResponse(login);
      await http()
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect((r) => expect([200, 201, 204]).toContain(r.status));
      await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('el login no revela si existe la cuenta (mismo código y mensaje)', async () => {
      const wrongPassword = await http()
        .post('/auth/login')
        .send({ email: userEmail, password: 'otra-clave-123' });
      const unknownEmail = await http()
        .post('/auth/login')
        .send({ email: `nadie-${Date.now()}@example.com`, password: PASSWORD });
      expect(wrongPassword.status).toBe(unknownEmail.status);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });

    it('pedir un reset responde igual exista o no el email', async () => {
      const existing = await http()
        .post('/auth/password/reset')
        .send({ email: userEmail });
      const unknown = await http()
        .post('/auth/password/reset')
        .send({ email: `nadie-${Date.now()}@example.com` });
      expect(existing.status).toBe(unknown.status);
      expect(existing.body).toEqual(unknown.body);
    });

    it('un JWT con alg=none no autentica', async () => {
      const payload = {
        sub: 'x',
        role: 'admin',
        tokenVersion: 0,
        exp: 4102444800,
      };
      const forged = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.`;
      await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('un JWT firmado con otro secreto no autentica', async () => {
      const payload = {
        sub: 'x',
        role: 'admin',
        tokenVersion: 0,
        exp: 4102444800,
      };
      const { createHmac } = await import('crypto');
      const head = b64url({ alg: 'HS256', typ: 'JWT' });
      const body = b64url(payload);
      const sig = createHmac('sha256', 'otro-secreto-que-no-es-el-real')
        .update(`${head}.${body}`)
        .digest('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${head}.${body}.${sig}`)
        .expect(401);
    });

    it('un token con el payload alterado (rol admin) no autentica', async () => {
      const [h, p, s] = userToken.split('.');
      const decoded = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
      const altered = b64url({ ...decoded, role: 'admin' });
      await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${h}.${altered}.${s}`)
        .expect(401);
    });

    it('una petición con cookie y Origin ajeno no se acepta (CSRF)', async () => {
      await http()
        .put('/users/me')
        .set('Cookie', userCookie)
        .set('Origin', 'https://evil.example')
        .send({})
        .expect(403);
    });
  });

  describe('S3: validación de entrada', () => {
    it('un UUID con inyección SQL en un filtro responde 400, no 200 ni 500', async () => {
      const res = await http()
        .get(`/region?languageId=${encodeURIComponent("' OR 1=1 --")}`)
        .set('Authorization', `Bearer ${await freshUserToken()}`);
      expect([400]).toContain(res.status);
    });

    it('mass assignment: PUT /users/me no acepta role=admin', async () => {
      const res = await http()
        .put('/users/me')
        .set('Authorization', `Bearer ${await freshUserToken()}`)
        .send({ role: 'admin' });
      expect([400]).toContain(res.status);
      const me = await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${await freshUserToken()}`)
        .expect(200);
      expect(me.body.role).toBe('user');
    });

    it('el body JSON por encima del límite global (1 MB) se rechaza', async () => {
      const big = { name: 'x'.repeat(1.5 * 1024 * 1024) };
      const res = await http()
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(big));
      expect(res.status).toBe(413);
    });
  });

  describe('S4: archivos y rutas', () => {
    // PNG 1x1 válido. `test/test-image.png` (15 bytes) no decodifica y no sirve de control.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );

    it('subir un PNG real como control responde 201', async () => {
      const res = await uploadAsSelf(png, 'control.png', 'image/png');
      expect([200, 201]).toContain(res.status);
    });

    it('un texto disfrazado de PNG se rechaza por magic bytes', async () => {
      const res = await uploadAsSelf(
        Buffer.from('<script>alert(1)</script>'),
        'falso.png',
        'image/png',
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('un SVG con script no se acepta como imagen', async () => {
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      );
      const res = await uploadAsSelf(svg, 'x.svg', 'image/svg+xml');
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('la carpeta de entrenamiento no se sirve por /shared, ni con codificaciones', async () => {
      for (const path of [
        '/shared/training_data/x',
        '/shared/%74raining_data/x',
        '/shared/models/..%2ftraining_data%2fx',
        '/shared/models/../training_data/x',
      ]) {
        const res = await http().get(path);
        expect({ path, ok: res.status !== 200 }).toEqual({ path, ok: true });
      }
    });

    it('la ruta de imágenes no sale del directorio con path traversal', async () => {
      for (const path of [
        '/images/user/..%2f..%2fpackage.json',
        '/images/user/..%252f..%252fpackage.json',
        '/images/..%2f..%2fetc%2fpasswd/x',
      ]) {
        const res = await http().get(path);
        expect({ path, ok: res.status !== 200 }).toEqual({ path, ok: true });
      }
    });
  });
});
