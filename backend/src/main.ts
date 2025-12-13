import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Log startup information
  logger.log('========================================');
  logger.log('🚀 Starting NutriMori Backend Application');
  logger.log('========================================');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Log environment info
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `Database URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`,
  );

  // Use cookie parser middleware
  app.use(cookieParser());
  logger.log('Cookie parser enabled');

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'https://nutri-mori.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  logger.log(`CORS enabled for: ${frontendUrl}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for API
  app.setGlobalPrefix('api');
  logger.log('Global API prefix set to: /api');

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('NutriMori API')
    .setDescription(
      'NutriMori Backend API Documentation - Nutrition Tracking & AI-Powered Food Logging',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('user-preferences', 'User preferences and dietary settings')
    .addTag('food-items', 'Food items and nutritional data')
    .addTag('food-logs', 'Food logging and tracking')
    .addTag('nutrition-rules', 'Nutrition rules and recommendations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://nutrimori.vercel.app/', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document, {
    customSiteTitle: 'NutriMori API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  logger.log('📚 Swagger documentation available at: /api/docs');

  // Get port
  const port = process.env.PORT ?? 3001;

  // Start listening
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces untuk deployment

  logger.log('========================================');
  logger.log(`✅ Application is running on: http://localhost:${port}`);
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔗 API Base URL: http://localhost:${port}/api`);
  logger.log('========================================');
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
