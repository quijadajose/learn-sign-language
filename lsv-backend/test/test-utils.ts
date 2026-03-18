import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

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
        await dataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
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
  app: any,
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
  app: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  app: any,
  dataSource: DataSource,
  adminToken: string,
  scope: 'language' | 'region',
  targetId: string,
): Promise<string> {
  const modEmail = `mod-${Date.now()}@example.com`;
  const modPassword = 'password123';

  // 1. Registro
  const regRes = await request(app.getHttpServer())
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

  const userId = regRes.body.data.user.id;

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

  // 3. Login
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: modEmail, password: modPassword })
    .expect(200);

  return response.body.data.token;
}
