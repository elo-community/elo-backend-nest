import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initializeNetwork } from './config/network-loader';

// BigInt 직렬화 문제 해결
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // 네트워크별 환경변수 로드
  initializeNetwork();

  // 로그 레벨 설정 (환경변수에서 가져오기)
  const logLevel = process.env.LOG_LEVEL || 'log';
  Logger.overrideLogger(logLevel === 'error' ? ['error'] :
    logLevel === 'warn' ? ['warn', 'error'] :
      logLevel === 'log' ? ['log', 'warn', 'error'] :
        logLevel === 'debug' ? ['debug', 'log', 'warn', 'error'] :
          ['log', 'warn', 'error']);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Trivus API')
    .setDescription('Trivus Backend API Documentation')
    .setVersion('1.0')
    .addServer('http://localhost:3000/api/v1', 'Local Development')
    .addServer('https://api.trivus.io/api/v1', 'Production')
    .addBearerAuth()
    .addTag('users', 'User management endpoints')
    .addTag('posts', 'Post management endpoints')
    .addTag('comments', 'Comment management endpoints')
    .addTag('elo', 'ELO rating system endpoints')
    .addTag('blockchain', 'Blockchain integration endpoints')
    .addTag('rewards', 'Reward system endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: configService.get('app.corsOrigins'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  app.setGlobalPrefix('api/v1');

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📝 Log level set to: ${logLevel}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
