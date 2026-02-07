import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // กำหนด charset UTF-8 สำหรับ JSON เพื่อให้ชื่อ/ข้อความภาษาไทยแสดงถูกต้อง
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson(body);
    };
    next();
  });

  // Performance: Gzip/Brotli compression - reduces response size 60-80%
  app.use(compression({ level: 6, threshold: 1024 }));

  // Body parser size limits - prevent DoS via large payloads
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true } as any);

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: false, // Allow iframe for Swagger
    })
  );

  // CORS - Enhanced Security
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    maxAge: 86400, // 24 hours
  });

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Custom error messages
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return constraints.join(', ');
        });
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    })
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('TeacherMon API')
    .setDescription('Kru Rak Thin Monitoring & Support System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('teachers', 'Teacher management endpoints')
    .addTag('schools', 'School management endpoints')
    .addTag('mentoring', 'Mentoring visit endpoints')
    .addTag('journals', 'Reflective journal endpoints')
    .addTag('plc', 'PLC activity endpoints')
    .addTag('assessment', 'Competency assessment endpoints')
    .addTag('dashboard', 'Dashboard and statistics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 TeacherMon API is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
