import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Sécurité
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: config.get<string[]>('app.corsOrigins', ['http://localhost:5173']),
    credentials: true,
  });

  // Préfixe global
  app.setGlobalPrefix('api');

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtre d'exception global
  app.useGlobalFilters(new HttpExceptionFilter(app.get(Reflector)));

  const port = config.get<number>('port', 3000);
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
