import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { ModulesContainer } from '@nestjs/core';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { writeFileSync } from 'fs';
import { AppModule } from '../../src/app.module.js';
import { IS_PUBLIC_KEY } from '../../src/auth/infrastructure/decorators/public.decorator.js';
import { RESOURCE_PERMISSION_KEY } from '../../src/permissions/infrastructure/interfaces/resource-permission-metadata.interface.js';
import {
  accessTokenFromAuthResponse,
  createLanguageCurriculum,
  findUserIdByEmail,
  getAdminToken,
  type LanguageCurriculum,
} from '../test-utils.js';

const PASSWORD = 'password123';
const ADMIN_EMAIL = 'test-admin@example.com';

/**
 * S1: matriz de autorización. Recorre todas las rutas de los controladores (leídas de
 * sus metadatos, no a mano) contra cuatro actores y comprueba que cada respuesta de
 * los guards coincide con lo que dicen `@Public`, `@Roles` y
 * `@RequireResourcePermission`.
 *
 * Reglas de la prueba:
 * - Los IDs de ruta son un UUID que no existe: una petición permitida termina en 404
 *   o 400 y no modifica datos.
 * - El cuerpo va vacío: la validación falla después de los guards, así que un 400
 *   sigue significando "el guard dejó pasar".
 * - "Denegado" = 401 o 403 producido antes del handler. "Permitido" = cualquier cosa que
 *   no sea 401/403. Cualquier 5xx es un fallo.
 * - Las rutas con `@RequireResourcePermission` para moderadores dependen del recurso
 *   (región o idioma), así que solo se comprueba que no devuelven 5xx.
 *
 * Si `AUTHZ_MATRIX_OUT` apunta a un archivo, se escribe la matriz completa en JSON.
 */

type Actor = {
  name: 'anonimo' | 'alumno' | 'moderador-A' | 'admin';
  role: string | null;
  /** Credenciales para iniciar sesión antes de cada petición (los logouts y cambios de
   *  perfil invalidan el token: `tokenVersion`). Null para el anónimo. */
  email: string | null;
};

type Route = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
  path: string;
  controller: string;
  handler: string;
  roles: string[] | undefined;
  isPublic: boolean;
  resourceScoped: boolean;
};

type Expectation = 'deny' | 'allow' | 'scoped';

type Row = {
  method: string;
  path: string;
  actor: Actor['name'];
  expected: Expectation;
  status: number;
  ok: boolean;
};

const METHOD_BY_NUMBER: Record<number, Route['method'] | undefined> = {
  0: 'get',
  1: 'post',
  2: 'put',
  3: 'delete',
  4: 'patch',
  7: 'head',
};

const FAKE_ID = '9f1c2a3e-4b5d-4e6f-8a7b-0c1d2e3f4a5b';

const joinPath = (...parts: string[]) =>
  '/' +
  parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

function collectRoutes(app: INestApplication): Route[] {
  const routes: Route[] = [];
  const modules = app.get(ModulesContainer);
  for (const mod of modules.values()) {
    for (const wrapper of mod.controllers.values()) {
      const ctrl = wrapper.metatype as
        (new (...args: never[]) => object) | undefined;
      if (!ctrl) continue;
      const ctrlPath =
        (Reflect.getMetadata(PATH_METADATA, ctrl) as string) ?? '';
      const classRoles = Reflect.getMetadata('roles', ctrl) as
        string[] | undefined;
      const classPublic = Reflect.getMetadata(IS_PUBLIC_KEY, ctrl) === true;

      for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
        if (name === 'constructor') continue;
        const handler = (ctrl.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        const methodNumber = Reflect.getMetadata(METHOD_METADATA, handler) as
          number | undefined;
        const method =
          methodNumber === undefined
            ? undefined
            : METHOD_BY_NUMBER[methodNumber];
        if (!method) continue;

        const methodPath =
          (Reflect.getMetadata(PATH_METADATA, handler) as string) ?? '';
        const handlerRoles = Reflect.getMetadata('roles', handler) as
          string[] | undefined;
        routes.push({
          method,
          path: joinPath(ctrlPath, methodPath),
          controller: ctrl.name,
          handler: name,
          roles: handlerRoles ?? classRoles,
          isPublic:
            Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true || classPublic,
          resourceScoped:
            Reflect.getMetadata(RESOURCE_PERMISSION_KEY, handler) !== undefined,
        });
      }
    }
  }
  return routes;
}

/** Controles de propiedad (solo el propio recurso): no se deducen de los metadatos. */
const OWNERSHIP_ROUTES = new Set(['/user-lesson/by-user/:id']);

function expectation(route: Route, actor: Actor): Expectation {
  if (route.isPublic) return 'allow';
  if (actor.role === null) return 'deny';
  // Con permiso por recurso, el ResourceAccessGuard decide con el recurso real. Con un
  // UUID falso responde 404 antes de negar, así que aquí solo se mira que no haya 5xx;
  // la decisión real se comprueba con IDs reales en el caso "recursos reales".
  if (route.resourceScoped && actor.role !== 'admin') return 'scoped';
  if (OWNERSHIP_ROUTES.has(route.path) && actor.role !== 'admin')
    return 'scoped';
  if (!route.roles) return 'allow';
  if (!route.roles.includes(actor.role)) return 'deny';
  return 'allow';
}

describe('Matriz de autorización por rol (S1, e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let actors: Actor[];
  let routes: Route[];
  let curriculumA: LanguageCurriculum;
  let curriculumB: LanguageCurriculum;
  const rows: Row[] = [];

  const http = () => request(app.getHttpServer());

  const login = async (email: string): Promise<string> =>
    accessTokenFromAuthResponse(
      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200),
    );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    // Escuchar de verdad: con el servidor sin `listen`, supertest falla en algunas rutas
    // que responden con fichero (GET /images) y deja de conectar al resto.
    await app.listen(0);
    dataSource = app.get(DataSource);

    const adminToken = await getAdminToken(app, dataSource);
    const curriculum: LanguageCurriculum = await createLanguageCurriculum(
      app,
      adminToken,
      'AUTHZ-A',
    );

    const userEmail = `authz-user-${Date.now()}@example.com`;
    await http()
      .post('/auth/register')
      .send({
        email: userEmail,
        password: PASSWORD,
        firstName: 'Authz',
        lastName: 'Alumno',
        age: 25,
        isRightHanded: true,
      })
      .expect(201);

    const modEmail = `authz-mod-${Date.now()}@example.com`;
    await http()
      .post('/auth/register')
      .send({
        email: modEmail,
        password: PASSWORD,
        firstName: 'Authz',
        lastName: 'Moderador',
        age: 30,
        isRightHanded: true,
      })
      .expect(201);
    await http()
      .post('/admin/moderators')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: await findUserIdByEmail(dataSource, modEmail),
        scope: 'language',
        targetId: curriculum.languageId,
      })
      .expect(201);

    curriculumB = await createLanguageCurriculum(app, adminToken, 'AUTHZ-B');
    curriculumA = curriculum;

    actors = [
      { name: 'anonimo', role: null, email: null },
      { name: 'alumno', role: 'user', email: userEmail },
      { name: 'moderador-A', role: 'moderator', email: modEmail },
      { name: 'admin', role: 'admin', email: ADMIN_EMAIL },
    ];
    routes = collectRoutes(app);
  });

  afterAll(async () => {
    if (process.env.AUTHZ_MATRIX_OUT) {
      writeFileSync(
        process.env.AUTHZ_MATRIX_OUT,
        JSON.stringify(rows, null, 2),
      );
    }
    await app?.close();
  });

  it('descubre las rutas de los controladores (sanidad del harness)', () => {
    // Si esto cae a cero, el resto de la prueba pasaría sin comprobar nada.
    expect(routes.length).toBeGreaterThan(80);
    expect(routes.some((r) => r.isPublic)).toBe(true);
    expect(routes.some((r) => r.roles?.includes('admin'))).toBe(true);
  });

  it('cada ruta responde como dicen sus guards en cada actor', async () => {
    const failures: string[] = [];

    for (const route of routes) {
      const path = route.path.replace(/:[A-Za-z]+/g, FAKE_ID);
      for (const actor of actors) {
        const expected = expectation(route, actor);
        let req = request(app.getHttpServer())[route.method](path);
        if (actor.email) {
          const token = await login(actor.email);
          req = req.set('Authorization', `Bearer ${token}`);
        }
        let status: number;
        try {
          const res =
            route.method === 'get' || route.method === 'head'
              ? await req
              : await req.send({});
          status = res.status;
        } catch (err) {
          status = 0;
          failures.push(
            `${route.method.toUpperCase()} ${route.path} [${actor.name}] error de transporte: ${(err as Error).message}`,
          );
          rows.push({
            method: route.method.toUpperCase(),
            path: route.path,
            actor: actor.name,
            expected,
            status,
            ok: false,
          });
          continue;
        }

        let ok: boolean;
        if (status >= 500) {
          ok = false;
        } else if (expected === 'deny') {
          ok = status === 401 || status === 403;
        } else if (expected === 'allow') {
          ok = status !== 401 && status !== 403;
        } else {
          ok = true; // con recurso: solo se exige que no sea 5xx
        }

        rows.push({
          method: route.method.toUpperCase(),
          path: route.path,
          actor: actor.name,
          expected,
          status,
          ok,
        });
        if (!ok) {
          failures.push(
            `${route.method.toUpperCase()} ${route.path} [${actor.name}] esperado=${expected} real=${status}`,
          );
        }
      }
    }

    const scoped = rows.filter((r) => r.expected === 'scoped').length;
    console.log(
      `Matriz: ${routes.length} rutas x ${actors.length} actores = ${rows.length} comprobaciones ` +
        `(${scoped} con recurso, solo 5xx). Fallos: ${failures.length}`,
    );
    expect(failures).toEqual([]);
  }, 300_000);

  // Regiones: catálogo público (decisión del dueño). Cualquier usuario autenticado puede
  // leer una región de cualquier idioma; el test fija ese comportamiento.
  it('regiones: cualquier usuario autenticado lee el catálogo (decisión: público)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/region/${curriculumB.regionId}`)
      .set(
        'Authorization',
        `Bearer ${await login(actors.find((x) => x.name === 'moderador-A')!.email!)}`,
      );
    expect(res.status).toBe(200);
  }, 60_000);

  it('recursos reales: permiso por idioma con IDs de dos idiomas', async () => {
    const a = curriculumA;
    const b = curriculumB;
    const actorOf = (name: Actor['name']) =>
      actors.find((x) => x.name === name)!;
    const send = async (
      who: Actor['name'],
      method: 'get' | 'put',
      path: string,
    ): Promise<number> => {
      const actor = actorOf(who);
      let req = request(app.getHttpServer())[method](path);
      if (actor.email) {
        req = req.set('Authorization', `Bearer ${await login(actor.email)}`);
      }
      return (await (method === 'put' ? req.send({}) : req)).status;
    };
    const denied = (status: number) => status === 401 || status === 403;

    // [actor, método, ruta, ¿debe denegarse?]
    const cases: Array<[Actor['name'], 'get' | 'put', string, boolean]> = [
      ['alumno', 'get', `/lesson/${a.lessonId}`, true],
      ['alumno', 'get', `/stage/${a.stageId}`, true],
      ['moderador-A', 'get', `/lesson/${a.lessonId}`, false],
      ['moderador-A', 'get', `/lesson/${b.lessonId}`, true],
      ['moderador-A', 'get', `/stage/${b.stageId}`, true],
      ['moderador-A', 'get', `/languages/${b.languageId}`, true],
      ['moderador-A', 'put', `/lesson/${b.lessonId}`, true],
      ['admin', 'get', `/lesson/${b.lessonId}`, false],
    ];

    const mismatches: string[] = [];
    for (const [who, method, path, mustDeny] of cases) {
      const status = await send(who, method, path);
      const ok = mustDeny ? denied(status) : !denied(status);
      if (!ok) {
        mismatches.push(
          `${method.toUpperCase()} ${path} [${who}] esperado=${mustDeny ? 'deny' : 'allow'} real=${status}`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  }, 120_000);
});
