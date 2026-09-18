import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigin =
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000';
  const origins = Array.from(
    new Set([
      configuredOrigin,
      configuredOrigin.replace('localhost', '127.0.0.1'),
      configuredOrigin.replace('127.0.0.1', 'localhost'),
    ]),
  );

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Biznes Radar AI API')
    .setDescription(
      'Market intelligence and financial planning API. Demo data is labeled as prototype data.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
