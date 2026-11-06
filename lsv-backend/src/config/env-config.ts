import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const KNOWN_WEAK_SECRETS = new Set([
  'secret',
  'password',
  'admin',
  'changeme',
  'ci-test-jwt-secret-not-for-prod',
]);

@ValidatorConstraint({ name: 'NotKnownWeakSecret', async: false })
export class NotKnownWeakSecret implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return !KNOWN_WEAK_SECRETS.has(value.trim().toLowerCase());
  }
  defaultMessage(): string {
    return 'Secreto no válido: usa un valor aleatorio y largo';
  }
}

export class EnvConfig {
  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test';

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsString()
  VALKEY_HOST: string;

  @IsNumber()
  VALKEY_PORT: number;

  @IsString()
  VALKEY_PASSWORD: string;

  @IsString()
  FRONTEND_URL: string;

  @IsNumber()
  API_PORT: number;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET debe tener al menos 32 caracteres',
  })
  @Validate(NotKnownWeakSecret)
  JWT_SECRET: string;

  /** HMAC de los jobs del trainer. Obligatorio y distinto de JWT_SECRET. */
  @IsString()
  @MinLength(32, {
    message: 'TRAINER_JOB_SECRET debe tener al menos 32 caracteres',
  })
  @Validate(NotKnownWeakSecret)
  TRAINER_JOB_SECRET: string;

  @IsEmail()
  API_ADMIN_EMAIL: string;

  @IsString()
  API_ADMIN_PASSWORD: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_URL: string;

  @IsString()
  EMAIL_HOST: string;

  @IsNumber()
  EMAIL_PORT: number;

  @IsString()
  EMAIL_USER: string;

  @IsString()
  EMAIL_PASSWORD: string;

  @IsBoolean()
  EMAIL_SECURE: boolean;
}
