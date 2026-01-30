import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseWrapperInterceptor } from './common/response-wrapper.interceptor';

function getCorsOrigin(): string | string[] {
  const origins = process.env.CORS_ORIGINS;
  if (origins && origins.trim()) {
    return origins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET must be set in production. See .env.example.',
      );
    }
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseWrapperInterceptor());

  // Enable CORS for frontend (HIPAA: restrict to known origins in production)
  app.enableCors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global API prefix to match frontend endpoints
  app.setGlobalPrefix('api/v1');

  // Global validation pipe with security settings (HIPAA: whitelist only expected fields)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are sent
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
