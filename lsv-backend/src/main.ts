import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import './instrument';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:8080';

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:8080'],
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
