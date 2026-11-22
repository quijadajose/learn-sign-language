import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvConfig } from './env-config.js';

/**
 * AS-S5-03: en producción el origen del frontend define CORS y el chequeo de Origin de
 * las cookies; sin HTTPS, un `http://` en esa variable dejaría pasar esos controles.
 */
export function assertFrontendUrlForEnv(nodeEnv: string, frontendUrl: string) {
  if (nodeEnv === 'production' && !/^https:\/\//.test(frontendUrl)) {
    throw new Error('FRONTEND_URL debe ser https:// en producción');
  }
}

export function validate(config: Record<string, unknown>) {
  console.log('Validating config. NODE_ENV:', config.NODE_ENV);
  const validatedConfig = plainToInstance(EnvConfig, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  assertFrontendUrlForEnv(
    validatedConfig.NODE_ENV,
    validatedConfig.FRONTEND_URL,
  );
  return validatedConfig;
}
