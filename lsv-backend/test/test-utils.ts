import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Request, Response } from 'express';
import {
  FEATURES_COUNT,
  HAND_FEATURE_START,
} from 'src/sign-record/domain/utils/landmark-validation';
import { createSharedModelsAuthMiddleware } from 'src/shared/infrastructure/middleware/shared-models-auth.middleware';
import { resolveLocale, translate } from 'src/i18n';

/**
 * Limpia todas las tablas de la base de datos de pruebas.
 * Útil para ejecutar antes de cada test e2e y asegurar un estado limpio.
 */
export async function cleanDatabase(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;
  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  if (tableNames) {
    try {
      // Postgres equivalent of SET FOREIGN_KEY_CHECKS = 0;
      await dataSource.query("SET session_replication_role = 'replica';");

      for (const entity of entities) {
        const tableName = entity.tableName;
        if (tableName === 'countries' || tableName === 'divisions') {
          continue;
        }
        await dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      }

      await dataSource.query("SET session_replication_role = 'origin';");
    } catch (error) {
      console.error('Error limpiando la base de datos de prueba:', error);
      throw error;
    }
  }
}

/**
 * Obtiene un token de administrador para los tests.
 * Si el usuario no existe, lo crea directamente en la DB para saltarse la restricción del controlador.
 */
export async function getAdminToken(
  app: INestApplication,
  dataSource: DataSource,
): Promise<string> {
  const adminEmail = 'test-admin@example.com';
  const adminPassword = 'password123';

  const repo = dataSource.getRepository('User');
  const admin = await repo.findOne({ where: { email: adminEmail } });

  if (!admin) {
    // Utilizamos BcryptService dinámicamente o usamos un hash conocido
    const hash = bcrypt.hashSync(adminPassword, 10);
    await repo.save({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'Test',
      hashPassword: hash,
      role: 'admin',
      age: 30,
      isRightHanded: true,
    });
  } else {
    // Asegurarnos de que ES admin
    admin['role'] = 'admin';
    await repo.save(admin);
  }

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: adminEmail, password: adminPassword });

  if (!response.body || !response.body.data || !response.body.data.token) {
    console.error(
      'Login failed! Response:',
      response.status,
      JSON.stringify(response.body, null, 2),
    );
    throw new Error(
      `Login failed for ${adminEmail} with status ${response.status}`,
    );
  }

  return response.body.data.token;
}

/**
 * Obtiene un token de usuario normal para los tests.
 */
export async function getUserToken(
  app: INestApplication,

  _dataSource: DataSource,
): Promise<string> {
  const userEmail = `test-user-${Date.now()}@example.com`;
  const userPassword = 'password123';

  // Registro
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: userEmail,
      password: userPassword,
      firstName: 'Normal',
      lastName: 'User',
      age: 25,
      isRightHanded: true,
    })
    .expect(201);

  // Login
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: userEmail, password: userPassword })
    .expect(200);

  return response.body.data.token;
}

/**
 * Asigna permisos de moderador a un usuario y obtiene su token.
 */
export async function getModeratorToken(
  app: INestApplication,
  dataSource: DataSource,
  adminToken: string,
  scope: 'language' | 'region',
  targetId: string,
): Promise<string> {
  const modEmail = `mod-${Date.now()}@example.com`;
  const modPassword = 'password123';

  // 1. Registro
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: modEmail,
      password: modPassword,
      firstName: 'Mod',
      lastName: 'User',
      age: 30,
      isRightHanded: true,
    })
    .expect(201);

  const userId = await findUserIdByEmail(dataSource, modEmail);

  // 2. Asignar permiso vía Admin API
  await request(app.getHttpServer())
    .post('/admin/moderators')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      userId: userId,
      scope: scope,
      targetId: targetId,
    })
    .expect(201);

  // RolesGuard lee `role` del JWT. Asignar el permiso no promociona al usuario;
  // sin esto el token seguiría siendo `user` y fallaría @Roles('moderator').
  const repo = dataSource.getRepository('User');
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error(`Moderator user ${userId} not found after assign`);
  }
  user['role'] = 'moderator';
  await repo.save(user);

  // 3. Login
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: modEmail, password: modPassword })
    .expect(200);

  return response.body.data.token;
}

/** Frames MediaPipe válidos (258 features) con mano activa para pasar validación. */
export function validLandmarkFrames(frameCount = 2): number[][] {
  return Array.from({ length: frameCount }, () => {
    const flat = Array<number>(FEATURES_COUNT).fill(0);
    for (let i = HAND_FEATURE_START; i < FEATURES_COUNT; i += 1) {
      flat[i] = 1;
    }
    return flat;
  });
}

export type LanguageCurriculum = {
  languageId: string;
  regionId: string;
  stageId: string;
  lessonId: string;
  lessonVariantId: string;
};

/** Language → region → stage → lesson → variant, listo para sign-record / train. */
export async function createLanguageCurriculum(
  app: INestApplication,
  adminToken: string,
  prefix: string,
): Promise<LanguageCurriculum> {
  const http = request(app.getHttpServer());
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const auth = { Authorization: `Bearer ${adminToken}` };

  const langRes = await http
    .post('/languages')
    .set(auth)
    .send({
      name: `${prefix} Lang ${suffix}`,
      description: 'e2e',
      countryCode: 'US',
    })
    .expect(201);

  const languageId = langRes.body.id as string;

  const regionRes = await http
    .post('/region')
    .set(auth)
    .send({
      name: `${prefix} Region ${suffix}`,
      code: `E${suffix.replace(/-/g, '').slice(-8)}`.slice(0, 10),
      description: 'e2e',
      languageId,
    })
    .expect(201);

  const stageRes = await http
    .post('/stage')
    .set(auth)
    .send({
      name: `${prefix} Stage`,
      description: 'e2e',
      languageId,
    })
    .expect(201);

  const lessonRes = await http
    .post('/lesson')
    .set(auth)
    .send({
      name: `${prefix} Lesson`,
      description: 'e2e',
      content: 'e2e',
      languageId,
      stageId: stageRes.body.id,
    })
    .expect(201);

  const variantRes = await http
    .post(`/lesson/${lessonRes.body.id}/variants`)
    .set(auth)
    .send({
      name: `${prefix} Variant`,
      description: 'e2e',
      content: 'e2e',
      regionId: regionRes.body.id,
    })
    .expect(201);

  return {
    languageId,
    regionId: regionRes.body.id,
    stageId: stageRes.body.id,
    lessonId: lessonRes.body.id,
    lessonVariantId: variantRes.body.id,
  };
}

export async function findUserIdByEmail(
  dataSource: DataSource,
  email: string,
): Promise<string> {
  const user = await dataSource
    .getRepository('User')
    .findOneByOrFail({ email });
  return user['id'] as string;
}

export function cookieHeaderFrom(response: {
  headers: { [key: string]: unknown };
}): string {
  const raw = response.headers['set-cookie'];
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return parts.map((cookie) => String(cookie).split(';')[0]).join('; ');
}

/** Same HTTP guards as `main.ts` for `/shared/training_data` and `/shared/models`. */
export function applySharedHttpGuards(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const jwtService = app.get(JwtService);

  app.use('/shared/training_data', (req: Request, res: Response) => {
    const locale = resolveLocale(req.headers['accept-language']);
    res
      .status(403)
      .json({ message: translate('errors.common.forbidden', locale) });
  });

  app.use(
    '/shared',
    createSharedModelsAuthMiddleware(configService, jwtService),
  );
}
