import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
  logger.log(`Database URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
  
  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  logger.log(`CORS enabled for: ${frontendUrl}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for API
  app.setGlobalPrefix('api');
  logger.log('Global API prefix set to: /api');

  // Get port
  const port = process.env.PORT ?? 3001;
  
  // Start listening
  await app.listen(port);
  
  // Log successful startup
  logger.log('✅ Application successfully started');
  logger.log(`🌐 Server running on: http://localhost:${port}`);
  logger.log(`📁 API Base URL: http://localhost:${port}/api`);
  logger.log(`🏥 Health Check: http://localhost:${port}/api/health`);
  logger.log(`🔍 Detailed Health: http://localhost:${port}/api/health/detailed`);
  logger.log('========================================');
  
  // Log memory usage
  const memoryUsage = process.memoryUsage();
  logger.debug(`Memory Usage - RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error.stack || error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bootstrap().catch((error) => {
  const logger = new Logger('BootstrapError');
  logger.error('Failed to bootstrap application:', error.stack || error.message);
  process.exit(1);
});