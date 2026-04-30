import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import './instrument';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getCorsOrigins } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static files from shared volume (models, etc)
  app.useStaticAssets(join(process.cwd(), 'shared'), {
    prefix: '/shared',
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    },
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

    console.log(
      `Swagger UI: http://localhost:${configService.get<number>('PORT') ?? 3000}/api/docs`,
    );
  }

  const port = configService.get<number>('PORT') ?? 3000;

  app.enableCors({
    origin: getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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
