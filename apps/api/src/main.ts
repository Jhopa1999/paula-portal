import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ResponseInterceptor } from './common/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Admite uno o varios origenes separados por coma (ej. Firebase + localhost).
  const corsOrigin = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigin, credentials: true });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Paula Web API')
      .setDescription('Backend Web del portal Paula (MVP).')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // --- Servir el frontend Angular compilado desde el mismo servidor ---
  // El backend entrega los estaticos de Angular y hace fallback a index.html
  // para las rutas del SPA. Asi frontend y API comparten origen (sin CORS,
  // sin problemas de red interna).
  const clientDir = join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser');
  if (existsSync(clientDir)) {
    app.useStaticAssets(clientDir);
    // Fallback SPA: cualquier peticion GET que no sea a /api ni /realtime,
    // y que no espere JSON, devuelve index.html para que el router de Angular
    // la maneje. Se registra como middleware para no chocar con las rutas.
    const indexHtml = join(clientDir, 'index.html');
    app.use((req: Request, res: Response, next: () => void) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/realtime') &&
        !req.path.startsWith('/socket.io')
      ) {
        res.sendFile(indexHtml);
        return;
      }
      next();
    });
    Logger.log(`Sirviendo frontend Angular desde ${clientDir}`, 'Bootstrap');
  } else {
    Logger.warn(
      `No se encontro el frontend compilado en ${clientDir}. ` +
        `Ejecuta "npm run build:web" antes de iniciar en produccion.`,
      'Bootstrap',
    );
  }

  const port = Number(process.env.API_PORT ?? 3000);
  const host = process.env.API_HOST ?? '0.0.0.0';
  await app.listen(port, host);
  Logger.log(`Paula Web API escuchando en http://${host}:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
