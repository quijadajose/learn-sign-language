import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { json, urlencoded, Request, Response, NextFunction } from 'express';
import './instrument';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getCorsOrigins } from './config/cors.config';
import { securityHeaders } from './config/security-headers';
import { requireTrustedOrigin } from './config/trusted-origin';
import { createSharedModelsAuthMiddleware } from './shared/infrastructure/middleware/shared-models-auth.middleware';
import { resolveLocale, translate } from './i18n';
import {
  buildOpenApiDocument,
  persistOpenApiDocument,
} from './shared/infrastructure/openapi/openapi';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const jwtService = app.get(JwtService);
  const logger = new Logger('Bootstrap');

  app.use(securityHeaders);
  app.use(requireTrustedOrigin);

  // Bloquear training_data (volumen interno para el trainer)
  app.use('/shared/training_data', (req: Request, res: Response) => {
    const locale = resolveLocale(req.headers['accept-language']);
    res
      .status(403)
      .json({ message: translate('errors.common.forbidden', locale) });
  });

  // CORS acotado para artefactos /shared/models
  app.use('/shared', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && getCorsOrigins().includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, Accept-Language',
      );
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  });

  // JWT obligatorio para TFJS bajo /shared/models
  app.use(
    '/shared',
    createSharedModelsAuthMiddleware(configService, jwtService),
  );

  app.useStaticAssets(join(process.cwd(), 'shared'), {
    prefix: '/shared',
  });

  // Límites específicos para grabación de señas (pesado)
  app.use('/sign-record', json({ limit: '50mb' }));
  app.use('/sign-record', urlencoded({ extended: true, limit: '50mb' }));

  // Límites globales estrictos para el resto (seguridad)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Swagger en desarrollo, o si se pide exportar el spec
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const port = configService.get<number>('PORT') ?? 3000;
  const serverUrl =
    configService.get<string>('API_PUBLIC_URL') || `http://localhost:${port}`;
  const shouldWriteOpenApi =
    nodeEnv === 'development' ||
    configService.get<string>('WRITE_OPENAPI') === 'true';

  if (shouldWriteOpenApi) {
    const document = buildOpenApiDocument(app, serverUrl);
    persistOpenApiDocument(document);
    if (nodeEnv === 'development') {
      SwaggerModule.setup('api/docs', app, document);
      logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
      logger.log(`OpenAPI spec escrito en swagger.json`);
    }
  }

  app.enableCors({
    origin: getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(port);
}
bootstrap();
