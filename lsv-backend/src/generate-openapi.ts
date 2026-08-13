import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  buildOpenApiDocument,
  persistOpenApiDocument,
} from './shared/infrastructure/openapi/openapi';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const serverUrl =
    configService.get<string>('API_PUBLIC_URL') || `http://localhost:${port}`;
  const document = buildOpenApiDocument(app, serverUrl);
  const outPath = persistOpenApiDocument(document);
  console.log(`OpenAPI spec escrito en ${outPath}`);
  await app.close();
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
