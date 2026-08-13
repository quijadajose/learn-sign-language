import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { json, urlencoded, Request, Response, NextFunction } from 'express';
import './instrument';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getCorsOrigins } from './config/cors.config';
import { createSharedModelsAuthMiddleware } from './shared/infrastructure/middleware/shared-models-auth.middleware';
import { resolveLocale, translate } from './i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const jwtService = app.get(JwtService);
  const logger = new Logger('Bootstrap');

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

  // Swagger disponible solo en modo desarrollo
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('API LSV')
      .setDescription('Documentación de la API del backend LSV')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(
      `Swagger UI: http://localhost:${configService.get<number>('PORT') ?? 3000}/api/docs`,
    );
  }

  const port = configService.get<number>('PORT') ?? 3000;

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
