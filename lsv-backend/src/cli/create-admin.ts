/**
 * BE-29: crea (o promueve) un administrador sin depender del seeder de desarrollo.
 *
 * Uso (desde lsv-backend, con la BD accesible):
 *   npm run create-admin -- --email admin@dominio.com --password "<contraseña>" \
 *     --first Nombre --last Apellido
 *
 * La contraseña se pasa por argumento: no la dejes en el historial del shell
 * (usa una variable de entorno y `--password "$ADMIN_PASSWORD"`).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module.js';
import { User } from '../shared/domain/entities/user.js';
import { UserRepositoryInterface } from '../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { HashService } from '../auth/domain/ports/hash.service.interface/hash.service.interface.js';
import { normalizeEmail } from '../auth/domain/utils/normalize-email.js';

function readArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main(): Promise<void> {
  const logger = new Logger('create-admin');
  const email = readArg('email');
  const password = readArg('password');
  const firstName = readArg('first') ?? 'Admin';
  const lastName = readArg('last') ?? 'LSV';

  if (!email || !password) {
    logger.error('Faltan --email y --password');
    process.exit(1);
  }
  if (password.length < 12) {
    logger.error('La contraseña debe tener al menos 12 caracteres');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const users = app.get<UserRepositoryInterface>('UserRepositoryInterface');
    const hashes = app.get<HashService>('HashService');
    const normalized = normalizeEmail(email);

    const existing = await users.findByEmail(normalized);
    if (existing) {
      existing.role = 'admin';
      existing.tokenVersion = (existing.tokenVersion ?? 0) + 1;
      await users.save(existing);
      logger.log(`Usuario existente promovido a admin: ${normalized}`);
    } else {
      const user = new User();
      user.email = normalized;
      user.firstName = firstName;
      user.lastName = lastName;
      user.age = 30;
      user.isRightHanded = true;
      user.role = 'admin';
      user.tokenVersion = 0;
      user.hashPassword = await hashes.hash(password);
      await users.save(user);
      logger.log(`Administrador creado: ${normalized}`);
    }
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
